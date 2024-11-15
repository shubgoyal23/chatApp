package helpers

import (
	"chatapp/models"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
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

func UserAuthMiddleware(c *gin.Context) {
	tokenString := c.Request.Header.Get("Authorization")
	if tokenString == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	secretKey := []byte(os.Getenv("JWT_SECRET"))

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the algorithm
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if err != nil {
		fmt.Println("Error decoding token:", err)
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		fmt.Println("Decoded JWT claims:", claims)
		c.Set("user", claims)
	} else {
		fmt.Println("Invalid token")
	}
	c.Next()
}

func SocketConnectionHandler(c *gin.Context) {
	user, f := c.Get("user")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
	}
	var userInfo models.User

	if data, err := json.Marshal(user); err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
	} else {
		if err := json.Unmarshal(data, &userInfo); err != nil {
			c.JSON(500, gin.H{
				"error": "Internal server error",
			})
		}
	}

	// upgrade the connection to a WebSocket connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	AllConns.Mu.Lock()
	AllConns.Conn[userInfo.ID] = models.UserConnection{WS: conn, UserInfo: userInfo}
	AllConns.Mu.Unlock()

	SetUserSocketId(userInfo.ID)

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
		fmt.Println("Received message:", string(message))
	}
}

func ReadAndSendMessages() {
	for {

	}
}
