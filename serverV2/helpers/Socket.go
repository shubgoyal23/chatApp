package helpers

import (
	"chatapp/models"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
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
	if f != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	if key == "" {
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

	if err := SetRedisKeyVal(fmt.Sprintf("chatuser:%s", userInfo.ID), VmId); err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	if err := SetKeyExpiry(fmt.Sprintf("chatuser:%s", userInfo.ID), 5); err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	AllConns.Mu.Lock()
	AllConns.Conn[userInfo.ID] = models.UserConnection{WS: conn, UserInfo: userInfo}
	AllConns.Mu.Unlock()

	// handle the WebSocket connection
	go UserSocketHandler(userInfo.ID)
}

func UserSocketHandler(userid string) {
	defer func() {
		AllConns.Mu.Lock()
		userconn := AllConns.Conn[userid]
		delete(AllConns.Conn, userid)
		AllConns.Mu.Unlock()
		userconn.WS.Close()
	}()

	AllConns.Mu.Lock()
	userconn := AllConns.Conn[userid]
	AllConns.Mu.Unlock()

	// handle the WebSocket connection
	for {
		_, message, err := userconn.WS.ReadMessage()
		if err != nil {
			fmt.Println("Error reading message:", err)
			break
		}
		fmt.Println("userkeus", userconn.UserInfo.KEY)
		dmessage, err := DecryptKeyAES(string(message), userconn.UserInfo, true)
		if err != nil {
			fmt.Println("Error decrypting message:", err)
			break
		}

		var msg models.Message
		if e := json.Unmarshal(dmessage, &msg); e != nil {
			fmt.Println("Error unmarshalling message:", e)
			break
		}
		msg.ID = uuid.New().String()
		if msg.Media == "" && msg.Message == "" {
			// faltu message
			continue
		}
		go SavemessageToDB(msg)
		go SendMessagestoUser(msg)
		msge, _ := json.Marshal(msg)
		m, _ := EncryptKeyAES(string(msge), userconn.UserInfo, true)
		userconn.WS.WriteMessage(websocket.TextMessage, []byte(m))

	}
}

func SendMessagestoUser(message models.Message) {
	to := message.To

	AllConns.Mu.RLock()
	sendUser, ok := AllConns.Conn[to]
	AllConns.Mu.RUnlock()

	// user is on other vm
	if !ok {
		// todo
	}
	msg, _ := json.Marshal(message)
	m, _ := EncryptKeyAES(string(msg), sendUser.UserInfo, true)
	if err := sendUser.WS.WriteMessage(websocket.TextMessage, []byte(m)); err != nil {
		fmt.Println("Error sending message:", err)
	}
}

func SavemessageToDB(msg models.Message) {
	// save message to db
}

func SendMessageToOtherVm(message models.Message, vmid string) {
	// send message to other vm
}
