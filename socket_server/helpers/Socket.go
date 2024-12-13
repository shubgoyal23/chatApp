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
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins, for production consider specific origins
		return true
	},
}

var AllConns *models.WSConn
var VmId string

func SocketInit() {
	AllConns = &models.WSConn{
		Mu:   &sync.RWMutex{},
		Conn: make(map[string]models.UserConnection),
	}
	// create a new vm id
	vm := uuid.New().String()
	VmId = strings.Split(vm, "-")[0]
}

// this function loops and checks for lost connections and old connections
func RemoveLostConnections() {
	for range time.Tick(time.Minute * 3) {
		AllConns.Mu.Lock()
		for k, v := range AllConns.Conn {
			if v.WS == nil {
				CloseUserConnection(k)
			} else if (time.Now().Unix() - v.Epoch) > 180 {
				CloseUserConnection(k)
			}
		}
		AllConns.Mu.Unlock()
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
	key, f := GetRedisKeyVal(fmt.Sprintf("usersk:%s", userd.ID))
	if f != nil || key == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	userd.KEY = key
	c.Set("user", userd)
	c.Next()
}

func SocketConnectionHandler(c *gin.Context) {
	user, f := c.Get("user")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
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

	if f := SetUserKeyAndExpiry(fmt.Sprintf("userVm:%s", userInfo.ID), 5); !f {
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
	AllConns.Conn[userInfo.ID] = models.UserConnection{WS: conn, UserInfo: userInfo, Epoch: time.Now().Unix()}
	AllConns.Mu.Unlock()

	// handle the WebSocket connection for particlular user
	go UserSocketHandler(userInfo.ID)
}

func UserSocketHandler(userid string) {
	defer func() {
		if f := recover(); f != nil {
			fmt.Println("Panic occurred:", f)
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
			fmt.Println("Error reading message:", err)
			break
		}
		dmessage, err := DecryptKeyAES(message, userconn.UserInfo, true)
		if err != nil {
			fmt.Println("Error decrypting message:", err)
			break
		}

		var msg models.Message
		if e := json.Unmarshal(dmessage, &msg); e != nil {
			fmt.Println("Error unmarshalling message:", e)
			continue
		}
		msg.ID = uuid.NewString()
		msg.Epoch = time.Now().Unix()
		if msg.Media == "" && msg.Message == "" {
			continue // empty message
		}
		if msg.Type == models.Ping {
			go HandelPingMessage(userid)
			continue
		} else if msg.Type == models.P2p {
			go SendMessagestoUser(msg)
		} else if msg.Type == models.Grp {
			go SendMessagestoGroup(msg)
			continue
		} else if msg.Type == models.Chat {
			continue
		} else if msg.Type == models.Offer || msg.Type == models.Ice || msg.Type == models.Answer {
			go HandleWebrtcOffer(msg)
			continue
		} else {
			continue
		}
		mse, _ := json.Marshal(msg)
		ms, _ := EncryptKeyAES(mse, userconn.UserInfo, true)
		if err := userconn.WS.WriteMessage(websocket.TextMessage, []byte(ms)); err != nil {
			fmt.Println("Error sending message:", err)
		}
		go SavemessageToDB(msg, "messages")
	}
}

func SendMessagestoUser(message models.Message) {
	defer func() {
		if f := recover(); f != nil {
			fmt.Println("Panic occurred in sendMessagetoUser:", f)
			return
		}
	}()
	to := message.To
	AllConns.Mu.RLock()
	sendUser, ok := AllConns.Conn[to]
	AllConns.Mu.RUnlock()

	var userOffline bool = false

	// if user is on same vm and online
	if ok {
		msg, _ := json.Marshal(message)
		m, _ := EncryptKeyAES(msg, sendUser.UserInfo, true)
		if err := sendUser.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
			fmt.Println("Error sending message:", err)
		}
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
	}
}

func SendMessagestoGroup(message models.Message) {
	defer func() {
		if f := recover(); f != nil {
			fmt.Println("Panic occurred in sendMessagetoGroup:", f)
			return
		}
	}()
	to := message.To
	members, err := GetAllRedisSetMemeber(fmt.Sprintf("group:%s", to))
	if err != nil {
		return
	}
	sendTo := []models.UserConnection{}
	offline := []string{}

	AllConns.Mu.RLock()
	for _, userid := range members {
		reciever, ok := AllConns.Conn[userid]
		if ok {
			sendTo = append(sendTo, reciever)
		} else {
			offline = append(offline, userid)
		}
	}
	AllConns.Mu.RUnlock()
	msg, _ := json.Marshal(message)
	go func() {
		for _, sendUser := range sendTo {
			m, _ := EncryptKeyAES(msg, sendUser.UserInfo, true)
			if err := sendUser.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
				fmt.Println("Error sending message:", err)
			}
		}
	}()

	// handle offline users and users on other vm
	if len(offline) > 0 {
		// todo
	}

}

// save message to db
func SavemessageToDB(msg models.Message, collection string) {
	defer func() {
		if f := recover(); f != nil {
			fmt.Println("Panic occurred in savemessageToDB:", f)
			return
		}
	}()
	var m models.MongoMessage
	from, _ := primitive.ObjectIDFromHex(msg.From)
	to, _ := primitive.ObjectIDFromHex(msg.To)
	m.Epoch = msg.Epoch
	m.From = from
	m.To = to
	m.ID = msg.ID
	m.Media = msg.Media
	m.Message = msg.Message
	m.ReplyTo = msg.ReplyTo
	m.Type = msg.Type
	data, err := bson.Marshal(m)
	if err != nil {
		fmt.Println("error marshalling data")
	}
	if f := MongoAddOncDoc(collection, data); !f {
		fmt.Println("error putting data to mongodb")
	}
}

// send message to other vm
func SendMessageToOtherVm(message models.Message, vmid string) bool {
	defer func() {
		if f := recover(); f != nil {
			fmt.Println("Panic occurred in sendMessageToOtherVm:", f)
			return
		}
	}()
	jsonmsg, err := json.Marshal(message)
	if err != nil {
		return false
	}
	if err := InsertRedisListLPush(fmt.Sprintf("vm:%s", vmid), []string{string(jsonmsg)}); err != nil {
		return false
	}
	return true
}

func CloseUserConnection(userid string) {
	AllConns.Mu.Lock()
	userconn := AllConns.Conn[userid]
	delete(AllConns.Conn, userid)
	AllConns.Mu.Unlock()
	if userconn.WS != nil {
		if err := userconn.WS.Close(); err != nil {
			fmt.Println("Error closing connection:", err)
		}
	}
	if err := DelRedisKey(fmt.Sprintf("userVm:%s", userid)); err != nil {
		fmt.Println("Error deleting key:", err)
	}
}

func HandelPingMessage(userid string) {
	AllConns.Mu.Lock()
	userconn := AllConns.Conn[userid]
	userconn.Epoch = time.Now().Unix()
	AllConns.Conn[userid] = userconn
	AllConns.Mu.Unlock()
	if f := SetUserKeyAndExpiry(fmt.Sprintf("userVm:%s", userid), 5); !f {
		fmt.Println("Error setting user key and expiry")
	}
}

func SetUserKeyAndExpiry(userid string, dur int) bool {
	if err := SetRedisKeyVal(userid, VmId); err != nil {
		fmt.Println("Error setting key value:", err)
		return false
	}
	if err := SetKeyExpiry(userid, dur); err != nil {
		fmt.Println("Error setting key expiry:", err)
		return false
	}
	return true
}

func HandleWebrtcOffer(offer models.Message) {
	to := offer.To

	AllConns.Mu.RLock()
	sendUser, ok := AllConns.Conn[to]
	AllConns.Mu.RUnlock()
	if !ok {
		// todo
		return
	}
	msg, _ := json.Marshal(offer)
	m, _ := EncryptKeyAES(msg, sendUser.UserInfo, true)
	if err := sendUser.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
		fmt.Println("Error sending message:", err)
	}
}

func ReadMessageQueue() {
	for {
		var failed []string = []string{}
		res, err := GetRedisListRPOP("vm:"+VmId, 100)
		if err != nil {
			fmt.Println("Error getting message from redis list:", err)
			time.Sleep(time.Second * 10)
			continue
		}

		for _, msg := range res {
			var message models.Message
			if err := json.Unmarshal(msg, &message); err != nil {
				fmt.Println("Error unmarshalling message:", err)
				failed = append(failed, string(msg))
				continue
			}
			SendMessagestoUser(message)
		}

		if len(failed) > 0 {
			InsertRedisListLPush("vm:"+VmId, failed)
		}
	}
}

func StoreOfflineMessages(msg models.Message, to string) {
	m := make(map[string]interface{})
	by, err := json.Marshal(msg)
	if err != nil {
		fmt.Println("")
	}
	m["body"] = string(by)
	m["to"] = to
	if f := MongoAddOncDoc("offline", m); !f {
		fmt.Println("error storing offline messages")
	}
}