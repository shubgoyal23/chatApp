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
	vm := uuid.New()
	VmId = strings.Split(vm.String(), "-")[0]
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

	AllConns.Mu.Lock()
	connExist, ok := AllConns.Conn[userInfo.ID]
	if ok {
		connExist.WS.Close()
	}
	AllConns.Mu.Unlock()

	// upgrade the connection to a WebSocket connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	if err := SetRedisKeyVal(fmt.Sprintf("userVm:%s", userInfo.ID), VmId); err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	if err := SetKeyExpiry(fmt.Sprintf("userVm:%s", userInfo.ID), 5); err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	userInfo.Epoch = time.Now().Unix()
	AllConns.Mu.Lock()
	AllConns.Conn[userInfo.ID] = models.UserConnection{WS: conn, UserInfo: userInfo}
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
			continue
		}
		if msg.Type == models.P2p {
			go SendMessagestoUser(msg, userconn)
		} else if msg.Type == models.Grp {
			go SendMessagestoGroup(msg)
		} else if msg.Type == models.Chat {

		} else if msg.Type == models.Offer || msg.Type == models.Ice || msg.Type == models.Answer {
			go HandleWebrtcOffer(msg)
			continue
		} else {
			continue
		}
		go SavemessageToDB(msg)
	}
}

func SendMessagestoUser(message models.Message, sender models.UserConnection) {
	to := message.To
	AllConns.Mu.RLock()
	sendUser, ok := AllConns.Conn[to]
	AllConns.Mu.RUnlock()

	// user is on other vm
	if !ok {
		// todo
		return
	}
	msg, _ := json.Marshal(message)
	m, _ := EncryptKeyAES(msg, sendUser.UserInfo, true)
	if err := sendUser.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
		fmt.Println("Error sending message:", err)
	}
	ms, _ := EncryptKeyAES(msg, sender.UserInfo, true)
	if err := sender.WS.WriteMessage(websocket.TextMessage, []byte(ms)); err != nil {
		fmt.Println("Error sending message:", err)
	}
}

func SendMessagestoGroup(message models.Message) {
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
func SavemessageToDB(msg models.Message) {
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
	if f := MongoAddOncDoc("messages", data); !f {
		fmt.Println("error putting data to mongodb")
	}
}

// send message to other vm
func SendMessageToOtherVm(message models.Message, vmid string) {
}

func CloseUserConnection(userid string) {
	AllConns.Mu.Lock()
	userconn := AllConns.Conn[userid]
	delete(AllConns.Conn, userid)
	AllConns.Mu.Unlock()
	if err := userconn.WS.Close(); err != nil {
		fmt.Println("Error closing connection:", err)
	}
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
