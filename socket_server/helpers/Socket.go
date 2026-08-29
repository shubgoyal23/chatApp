package helpers

import (
	"chatapp/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.uber.org/zap"
)

var Origins []string

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		for _, v := range Origins {
			if v == origin {
				return true
			}
		}
		return false
	},
}

var AllConns sync.Map
var VmId string
var ActiveConns int
var savemsgs chan models.Message

func RegisterVmid(vmid string) {
	AllConns = sync.Map{}
	VmId = vmid
	InsertRedisSet("VMsRunning", VmId)
	Logger.Info("VM ID registered", zap.String("vmid", VmId))

	// save messages to db
	savemsgs = make(chan models.Message)
	go SavemessageToDBWorker("messages")

	// load all groups and insert in redis
	groups, ok := MongoGetManyDoc("groups", bson.M{})
	if !ok {
		Logger.Error("Error loading groups")
	}
	for _, group := range groups {
		id := group["_id"].(primitive.ObjectID)
		group["_id"] = id.Hex()
		var members []string
		for _, member := range group["members"].(primitive.A) {
			members = append(members, member.(primitive.ObjectID).Hex())
		}
		InsertRedisSet(fmt.Sprintf("group:%s", id.Hex()), members...)
	}
}

// this function loops and checks for lost connections and old connections
func RemoveLostConnections() {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	count := 0
	t := time.Now().Unix()
	AllConns.Range(func(key, value interface{}) bool {
		conn := value.(*models.Conn)
		userId := key.(primitive.ObjectID)
		if conn.WS == nil {
			CloseUserConnection(userId)
		} else if (t - conn.Epoch) > 90 {
			CloseUserConnection(userId)
		}
		count++
		return true
	})
	ActiveConns = max(ActiveConns, count)
}

func UserAuthMiddlewareWS(c *gin.Context) {
	tokenString := c.Query("token")
	if tokenString == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	tokenString = strings.Replace(tokenString, " ", "+", -1)
	tokenString = strings.Replace(tokenString, "%2", "/", -1)
	userdata, err := DecryptRsaDatabyPrivateKey(tokenString)
	if err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	var userd models.User
	if errj := json.Unmarshal([]byte(userdata), &userd); errj != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	key, f := GetRedisKeyVal(fmt.Sprintf("usersk:%s", userd.ID.Hex()))
	if f != nil || key == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	userd.KEY = key
	c.Set("user", userd)
	c.Next()
}

func SocketConnectionHandler(c *gin.Context) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	user, f := c.Get("user")
	if !f {
		Logger.Error("User not found")
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	userInfo := user.(models.User)

	// upgrade the connection to a WebSocket connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	if f := SetUserKeyAndExpiry(userInfo.ID.Hex(), 300); !f {
		conn.Close()
		return
	}
	userInfo.Epoch = time.Now().Unix()

	// Signal old handler goroutine to stop before replacing the connection.
	// This prevents the old goroutine's defer from closing the NEW connection.
	if old, ok := AllConns.Load(userInfo.ID); ok {
		oldConn := old.(*models.Conn)
		// Signal the old handler to exit
		select {
		case <-oldConn.Done:
			// already closed
		default:
			close(oldConn.Done)
		}
		// Close the old WebSocket
		if oldConn.WS != nil {
			oldConn.WS.Close()
		}
		AllConns.Delete(userInfo.ID)
		if err := DelRedisKey(fmt.Sprintf("userVm:%s", userInfo.ID)); err != nil {
			Logger.Error("Error deleting key:", zap.Error(err))
		}
	}

	conn.SetReadDeadline(time.Now().Add(120 * time.Second))
	newConn := &models.Conn{
		WS:       conn,
		UserInfo: userInfo,
		Epoch:    time.Now().Unix(),
		Done:     make(chan struct{}),
	}
	AllConns.Store(userInfo.ID, newConn)

	// handle the WebSocket connection for particlular user
	go UserSocketHandler(userInfo.ID, newConn)
	go GetOfflineMessages(userInfo.ID)
}

func UserSocketHandler(userid primitive.ObjectID, userconn *models.Conn) {
	// Track whether this goroutine was superseded by a new connection.
	// If so, we must NOT call CloseUserConnection (it would kill the new conn).
	superseded := false
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
		if !superseded {
			CloseUserConnection(userid)
		}
	}()

	// handle the WebSocket connection
	for {
		// Check if this goroutine has been superseded by a reconnect
		select {
		case <-userconn.Done:
			superseded = true
			return
		default:
		}

		_, message, err := userconn.WS.ReadMessage()
		if err != nil {
			// Check if we were superseded while blocked in ReadMessage
			select {
			case <-userconn.Done:
				superseded = true
				return
			default:
			}
			Logger.Error("Error reading message:", zap.Error(err))
			break
		}
		dmessage, err := DecryptKeyAES(message, userconn.UserInfo, true)
		if err != nil {
			Logger.Error("Error decrypting message:", zap.Error(err))
			break
		}
		var msg models.Message
		if e := json.Unmarshal(dmessage, &msg); e != nil {
			Logger.Error("Error unmarshalling message:", zap.Error(e))
			continue
		}
		// msg.ID = uuid.NewString()
		msg.Epoch = time.Now().Unix()
		if msg.Media == "" && msg.Message == "" {
			continue // empty message
		}
		if msg.To == primitive.NilObjectID || msg.From != userid {
			continue // invalid message
		}
		switch msg.Type {
		case models.Ping:
			go HandelPingMessage(userid, userconn)
		case models.P2p:
			go SendMessagestoUser(msg, msg.To)
			go SendMessagestoSelf(msg, userconn)
			savemsgs <- msg
		case models.Grp:
			go SendMessagestoGroup(msg)
			savemsgs <- msg
		case models.Chat:
		case models.UserOnline:
			go func() {
				online := CheckUserOnline(msg.To.Hex())
				switch online {
				case true:
					msg.Message = "online"
				case false:
					msg.Message = "offline"
				}
				SendMessagestoSelf(msg, userconn)
			}()
		case models.Call:
			go HandleWebrtcOffer(msg)
		case models.Offer:
			go HandleWebrtcOffer(msg)
		case models.Ice:
			go HandleWebrtcOffer(msg)
		case models.Answer:
			go HandleWebrtcOffer(msg)
		case models.CallEnd:
			go HandleWebrtcOffer(msg)
		default:
		}
	}
}

// safeWriteMessage acquires the conn's mutex before writing to the WebSocket.
// gorilla/websocket panics on concurrent writes; this prevents that.
func safeWriteMessage(userconn *models.Conn, msgType int, data []byte) error {
	userconn.Mu.Lock()
	defer userconn.Mu.Unlock()
	if userconn.WS == nil {
		return fmt.Errorf("websocket connection is nil")
	}
	return userconn.WS.WriteMessage(msgType, data)
}

func SendMessagestoSelf(msg models.Message, userconn *models.Conn) {
	mse, _ := json.Marshal(msg)
	ms, _ := EncryptKeyAES(mse, userconn.UserInfo, true)
	if err := safeWriteMessage(userconn, websocket.TextMessage, []byte(ms)); err != nil {
		Logger.Error("Error sending message:", zap.Error(err))
	}
}

func SendMessagestoUser(message models.Message, to primitive.ObjectID) (f bool) {
	f = true
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in sendMessagetoUser:", zap.Error(fmt.Errorf("%v", f)))
			return
		}
	}()

	// check if user is on same vm
	user, ok := AllConns.Load(to)

	var userOffline bool = false

	// if user is on same vm and online
	if ok {
		sendUser := user.(*models.Conn)
		msg, _ := json.Marshal(message)
		m, _ := EncryptKeyAES(msg, sendUser.UserInfo, true)
		if err := safeWriteMessage(sendUser, websocket.TextMessage, []byte(m)); err != nil {
			Logger.Error("Error sending message:", zap.Error(err))
			CloseUserConnection(to)
		}
		return
	}

	// if user is on other vm
	vm, err := GetRedisKeyVal(fmt.Sprintf("userVm:%s", to))
	if err != nil {
		userOffline = true
	} else {
		if f := SendMessageToOtherVm(message, vm); !f {
			userOffline = true
		}
	}
	if userOffline {
		StoreOfflineMessages(message, to)
		f = false
	}
	return
}

func SendMessagestoGroup(message models.Message) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in sendMessagetoGroup:", zap.Error(fmt.Errorf("%v", f)))
			return
		}
	}()
	to := message.To
	members, err := GetAllRedisSetMemeber(fmt.Sprintf("group:%s", to))
	if err != nil {
		return
	}
	for _, userid := range members {
		id, err := primitive.ObjectIDFromHex(userid)
		if err != nil {
			Logger.Error("Invalid userId", zap.String("UserId: ", userid))
		}
		go SendMessagestoUser(message, id)
	}
}

// save message to db
func SavemessageToDBWorker(collection string) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in savemessageToDB:", zap.Error(fmt.Errorf("%v", f)))
			return
		}
	}()
	for msg := range savemsgs {
		data, err := bson.Marshal(msg)
		if err != nil {
			Logger.Error("Error marshalling data:", zap.Error(err))
		}
		if f := MongoAddOncDoc(collection, data); !f {
			Logger.Error("Error putting data to mongodb:", zap.Error(err))
		}
	}
}

// send message to other vm
func SendMessageToOtherVm(message models.Message, vmid string) bool {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in sendMessageToOtherVm:", zap.Error(fmt.Errorf("%v", f)))
			return
		}
	}()
	jsonmsg, err := json.Marshal(message)
	if err != nil {
		return false
	}

	if err := WriteStream(string(jsonmsg), "chatzz:"+vmid); err != nil {
		return false
	}
	// KafkaProducer.Produce(&kafka.Message{
	// 	TopicPartition: kafka.TopicPartition{Topic: &vmid, Partition: kafka.PartitionAny},
	// 	Key:            []byte(message.To.Hex()),
	// 	Value:          jsonmsg,
	// }, nil)
	// if err := InsertRedisListLPush(fmt.Sprintf("vm:%s", vmid), []string{string(jsonmsg)}); err != nil {
	// 	return false
	// }
	return true
}

func CloseUserConnection(userid primitive.ObjectID) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in closeUserConnection:", zap.Error(fmt.Errorf("%v", f)))
			return
		}
	}()
	conn, ok := AllConns.Load(userid)
	if !ok {
		return
	}
	userconn := conn.(*models.Conn)
	if userconn.WS != nil {
		if err := userconn.WS.Close(); err != nil {
			Logger.Error("Error closing connection:", zap.Error(err))
		}
	}
	if err := DelRedisKey(fmt.Sprintf("userVm:%s", userid)); err != nil {
		Logger.Error("Error deleting key:", zap.Error(err))
	}
	AllConns.Delete(userid)
}

func HandelPingMessage(userid primitive.ObjectID, userconn *models.Conn) {
	userconn.Epoch = time.Now().Unix()
	// Extend the read deadline so the connection stays alive as long as pings arrive
	userconn.WS.SetReadDeadline(time.Now().Add(120 * time.Second))
	msg, _ := json.Marshal(models.Message{Type: models.Pong, From: userid})
	m, _ := EncryptKeyAES(msg, userconn.UserInfo, true)
	if err := safeWriteMessage(userconn, websocket.TextMessage, []byte(m)); err != nil {
		Logger.Error("Error sending message:", zap.Error(err))
		CloseUserConnection(userid)
	}
	if f := SetUserKeyAndExpiry(userid.Hex(), 300); !f {
		Logger.Error("Error setting user key and expiry")
	}
}

func SetUserKeyAndExpiry(userid string, dur int) bool {
	if err := SetRedisKeyVal(fmt.Sprintf("userVm:%s", userid), VmId); err != nil {
		Logger.Error("Error setting key value:", zap.Error(err))
		return false
	}
	if err := SetKeyExpiry(fmt.Sprintf("userVm:%s", userid), dur); err != nil {
		Logger.Error("Error setting key expiry:", zap.Error(err))
		return false
	}
	return true
}

func HandleWebrtcOffer(offer models.Message) {
	if offer.Type == models.Call {
		if f := SendMessagestoUser(offer, offer.To); !f {
			offer.Message = "offline"
			SendMessagestoUser(offer, offer.From)
		}
		return
	}
	to := offer.To
	SendMessagestoUser(offer, to)
}

// func ReadMessageQueue(ctx context.Context) {
// 	for {
// 		select {
// 		case <-ctx.Done():
// 			return
// 		default:
// 			msg, err := KafkaConsumer.ReadMessage(-1)
// 			if err != nil {
// 				if kafkaErr, ok := err.(kafka.Error); ok && kafkaErr.IsFatal() {
// 					log.Fatalf("Fatal error: %v\n", kafkaErr)
// 				} else {
// 					log.Printf("Error consuming message: %v\n", err)
// 				}
// 				continue
// 			}
// 			var message models.Message
// 			if err := json.Unmarshal(msg.Value, &message); err != nil {
// 				fmt.Println("Error unmarshalling message:", err)
// 				continue
// 			}
// 			SendMessagestoUser(message, message.To)
// 		}
// 	}
// }

func StoreOfflineMessages(msg models.Message, to primitive.ObjectID) {
	jsonmsg, _ := json.Marshal(msg)
	var m map[string]interface{}
	if err := json.Unmarshal(jsonmsg, &m); err != nil {
		Logger.Error("Error unmarshalling message:")
		return
	}
	m["to"] = to
	m["from"] = msg.From
	if f := MongoAddOncDoc("offline", m); !f {
		Logger.Error("Error storing offline messages:")
	}
}

func CheckUserOnline(userid string) bool {
	vm, err := GetRedisKeyVal(fmt.Sprintf("userVm:%s", userid))
	if err != nil || vm == "" {
		return false
	}
	return true
}

func GetOfflineMessages(userid primitive.ObjectID) {
	messages, err := MongoGetManyDoc("offline", bson.M{"$or": []bson.M{{"to": userid}, {"toUser": userid}}})
	if !err {
		Logger.Error("Error getting offline messages:")
		return
	}
	ids := []primitive.ObjectID{}
	for _, message := range messages {
		bydata, _ := bson.Marshal(message)
		var msg models.Message
		if err := bson.Unmarshal(bydata, &msg); err != nil {
			Logger.Error("Error unmarshalling message:", zap.Error(err))
			continue
		}
		go SendMessagestoUser(msg, userid)
		ids = append(ids, message["_id"].(primitive.ObjectID))
	}

	if f := MongoDeleteManyDoc("offline", bson.M{"_id": bson.M{"$in": ids}}); !f {
		Logger.Error("Error deleting offline messages:")
	}
}
