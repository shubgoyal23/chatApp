package helpers

import (
	"chatapp/models"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

var AllConns *models.WSConn
var VmId string

func RegisterVmid() {
	AllConns = &models.WSConn{
		Mu:   &sync.RWMutex{},
		Conn: make(map[primitive.ObjectID]*models.UserConnection),
	}
	// create a new vm id
	VmId = os.Getenv("VM_ID")
	// vm := uuid.New().String()
	// VmId = strings.Split(vm, "-")[0]
	InsertRedisSet("VMsRunning", VmId)
}

// this function loops and checks for lost connections and old connections
func RemoveLostConnections() {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	for range time.Tick(time.Minute * 1) {
		AllConns.Mu.Lock()
		allcon := AllConns
		AllConns.Mu.Unlock()
		for k, v := range allcon.Conn {
			if v.WS == nil {
				CloseUserConnection(k)
				continue
			} else if (time.Now().Unix() - v.Epoch) > 180 {
				CloseUserConnection(k)
				continue
			}
			if err := v.WS.WriteMessage(websocket.PingMessage, []byte{}); err != nil {
				CloseUserConnection(k)
				continue
			}
		}
	}
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

	if f := SetUserKeyAndExpiry(fmt.Sprintf("userVm:%s", userInfo.ID.Hex()), 300); !f {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	userInfo.Epoch = time.Now().Unix()
	AllConns.Mu.Lock()
	connExist, ok := AllConns.Conn[userInfo.ID]
	if ok {
		connExist.WS.Close()
	}
	AllConns.Conn[userInfo.ID] = &models.UserConnection{WS: conn, UserInfo: userInfo, Epoch: time.Now().Unix()}
	AllConns.Mu.Unlock()

	// handle the WebSocket connection for particlular user
	go UserSocketHandler(userInfo.ID)
	go GetOfflineMessages(userInfo.ID)
}

func UserSocketHandler(userid primitive.ObjectID) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
			CloseUserConnection(userid)
			return
		}
		CloseUserConnection(userid)
	}()

	AllConns.Mu.RLock()
	userconn := AllConns.Conn[userid]
	AllConns.Mu.RUnlock()

	// handle the WebSocket connection
	for {
		_, message, err := userconn.WS.ReadMessage()
		if err != nil {
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
		msg.ID = uuid.NewString()
		msg.Epoch = time.Now().Unix()
		if msg.Media == "" && msg.Message == "" {
			continue // empty message
		}
		if msg.To == primitive.NilObjectID || msg.From != userid {
			continue // invalid message
		}
		switch msg.Type {
		case models.Ping:
			go HandelPingMessage(userid)
		case models.P2p:
			go SendMessagestoUser(msg, msg.To)
			go SendMessagestoSelf(msg, userconn)
			go SavemessageToDB(msg, "messages")
		case models.Grp:
			go SendMessagestoGroup(msg)
			go SavemessageToDB(msg, "messages")
		case models.Chat:
		case models.UserOnline:
			go func() {
				online := CheckUserOnline(msg.To)
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

func SendMessagestoSelf(msg models.Message, userconn *models.UserConnection) {
	mse, _ := json.Marshal(msg)
	ms, _ := EncryptKeyAES(mse, userconn.UserInfo, true)
	if err := userconn.WS.WriteMessage(websocket.TextMessage, []byte(ms)); err != nil {
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
	AllConns.Mu.RLock()
	sendUser, ok := AllConns.Conn[to]
	AllConns.Mu.RUnlock()

	var userOffline bool = false

	// if user is on same vm and online
	if ok {
		msg, _ := json.Marshal(message)
		m, _ := EncryptKeyAES(msg, sendUser.UserInfo, true)
		if err := sendUser.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
			Logger.Error("Error sending message:", zap.Error(err))
			CloseUserConnection(to)
		} else {
			return
		}
	}

	// if user is on other vm
	vm, err := GetRedisKeyVal(fmt.Sprintf("userVm:%s", to.Hex()))
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
	members, err := GetAllRedisSetMemeber(fmt.Sprintf("group:%s", to.Hex()))
	if err != nil {
		return
	}
	for _, userid := range members {
		ui, _ := primitive.ObjectIDFromHex(userid)
		go SendMessagestoUser(message, ui)
	}
}

// save message to db
func SavemessageToDB(msg models.Message, collection string) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in savemessageToDB:", zap.Error(fmt.Errorf("%v", f)))
			return
		}
	}()
	data, err := bson.Marshal(msg)
	if err != nil {
		Logger.Error("Error marshalling data:", zap.Error(err))
	}
	if f := MongoAddOncDoc(collection, data); !f {
		Logger.Error("Error putting data to mongodb:", zap.Error(err))
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

	m, _ := json.Marshal(jsonmsg)
	if err := WriteStream(string(m), "chatzz:"+vmid); err != nil {
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
	AllConns.Mu.Lock()
	userconn := AllConns.Conn[userid]
	delete(AllConns.Conn, userid)
	AllConns.Mu.Unlock()
	if userconn.WS != nil {
		if err := userconn.WS.Close(); err != nil {
			Logger.Error("Error closing connection:", zap.Error(err))
		}
	}
	if err := DelRedisKey(fmt.Sprintf("userVm:%s", userid.Hex())); err != nil {
		Logger.Error("Error deleting key:", zap.Error(err))
	}
}

func HandelPingMessage(userid primitive.ObjectID) {
	AllConns.Mu.Lock()
	user := AllConns.Conn[userid]
	user.Epoch = time.Now().Unix()
	msg, _ := json.Marshal(models.Message{Type: models.Pong, From: userid})
	m, _ := EncryptKeyAES(msg, user.UserInfo, true)
	if err := user.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
		Logger.Error("Error sending message:", zap.Error(err))
		CloseUserConnection(userid)
	}
	AllConns.Mu.Unlock()
	if f := SetUserKeyAndExpiry(fmt.Sprintf("userVm:%s", userid.Hex()), 300); !f {
		Logger.Error("Error setting user key and expiry")
	}
}

func SetUserKeyAndExpiry(userid string, dur int) bool {
	if err := SetRedisKeyVal(userid, VmId); err != nil {
		Logger.Error("Error setting key value:", zap.Error(err))
		return false
	}
	if err := SetKeyExpiry(userid, dur); err != nil {
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
			return
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
	if msg.Type == models.Grp {
		jsonmsg, _ := json.Marshal(msg)
		var m map[string]interface{}
		if err := json.Unmarshal(jsonmsg, &m); err != nil {
			Logger.Error("Error unmarshalling message:")
			return
		}
		m["toUser"] = to
		if f := MongoAddOncDoc("offline", m); !f {
			Logger.Error("Error storing offline messages:")
		}
		return
	}
	if f := MongoAddOncDoc("offline", msg); !f {
		Logger.Error("Error storing offline messages:")
	}
}

func CheckUserOnline(userid primitive.ObjectID) bool {
	vm, err := GetRedisKeyVal(fmt.Sprintf("userVm:%s", userid.Hex()))
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
