package helpers

import (
	"chatapp/models"
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.uber.org/zap"
)

const (
	// maxMessageSize bounds a single encrypted frame; WebRTC SDP offers are the
	// largest legitimate payload and stay well under this.
	maxMessageSize = 128 * 1024
	// maxTextLength bounds the plaintext of a chat message.
	maxTextLength = 8000
	readTimeout   = 120 * time.Second
	writeTimeout  = 10 * time.Second
	// CloseReplaced tells a client its session was taken over by a newer
	// connection of the same user, so it must not auto-reconnect.
	CloseReplaced = 4000
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

	// save messages to db; buffered so a slow database never stalls readers
	savemsgs = make(chan models.Message, 1024)
	for range 4 {
		go SavemessageToDBWorker("messages")
	}

	// load all groups and insert in redis
	groups, ok := MongoGetManyDoc("groups", bson.M{})
	if !ok {
		Logger.Error("Error loading groups")
	}
	for _, group := range groups {
		id, ok := group["_id"].(primitive.ObjectID)
		if !ok {
			continue
		}
		list, _ := group["members"].(primitive.A)
		var members []string
		for _, member := range list {
			switch m := member.(type) {
			case primitive.ObjectID:
				members = append(members, m.Hex())
			case string:
				members = append(members, m)
			}
		}
		if len(members) > 0 {
			InsertRedisSet(groupKey(id), members...)
		}
	}
}

func userVmKey(id primitive.ObjectID) string {
	return fmt.Sprintf("userVm:%s", id.Hex())
}

func groupKey(id primitive.ObjectID) string {
	return fmt.Sprintf("group:%s", id.Hex())
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
		if conn.WS == nil || (t-conn.Epoch.Load()) > 90 {
			CloseConn(userId, conn)
		}
		count++
		return true
	})
	ActiveConns = max(ActiveConns, count)
}

// UserAuthMiddlewareWS authenticates the websocket handshake. The token is the
// user's JSON encrypted with the server's RSA public key; since anyone can
// encrypt with a public key, the token must also carry the session key handed
// out by /user/key (which requires a valid JWT), and that key must match.
func UserAuthMiddlewareWS(c *gin.Context) {
	tokenString := c.Query("token")
	if tokenString == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	// older clients send the base64 token without URL-encoding it
	tokenString = strings.ReplaceAll(tokenString, " ", "+")
	userdata, err := DecryptRsaDatabyPrivateKey(tokenString)
	if err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	var userd models.User
	if errj := json.Unmarshal([]byte(userdata), &userd); errj != nil || userd.ID.IsZero() || userd.KEY == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	stored, f := GetRedisKeyVal(fmt.Sprintf("usersk:%s", userd.ID.Hex()))
	if f != nil || stored == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	var session models.Session
	if err := json.Unmarshal([]byte(stored), &session); err != nil || session.Key == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	if subtle.ConstantTimeCompare([]byte(session.Key), []byte(userd.KEY)) != 1 {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	userd.Email = session.Email
	userd.UserName = session.UserName
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

	// upgrade the connection to a WebSocket connection; on failure the
	// upgrader has already written the HTTP error response
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	conn.SetReadLimit(maxMessageSize)

	if f := SetUserKeyAndExpiry(userInfo.ID, 300); !f {
		conn.Close()
		return
	}
	userInfo.Epoch = time.Now().Unix()

	// Signal the old handler goroutine to stop before replacing the connection,
	// so its deferred cleanup cannot close the NEW connection.
	if old, ok := AllConns.Load(userInfo.ID); ok {
		oldConn := old.(*models.Conn)
		oldConn.Stop()
		if oldConn.WS != nil {
			oldConn.WS.WriteControl(websocket.CloseMessage,
				websocket.FormatCloseMessage(CloseReplaced, "session opened elsewhere"),
				time.Now().Add(time.Second))
			oldConn.WS.Close()
		}
	}

	conn.SetReadDeadline(time.Now().Add(readTimeout))
	newConn := &models.Conn{
		WS:       conn,
		UserInfo: userInfo,
		Done:     make(chan struct{}),
	}
	newConn.Epoch.Store(time.Now().Unix())
	AllConns.Store(userInfo.ID, newConn)
	// the old connection's cleanup may have removed the mapping in between
	SetUserKeyAndExpiry(userInfo.ID, 300)

	// handle the WebSocket connection for particlular user
	go UserSocketHandler(userInfo.ID, newConn)
	go GetOfflineMessages(userInfo.ID)
}

func UserSocketHandler(userid primitive.ObjectID, userconn *models.Conn) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
		// CloseConn only removes the mapping if it still points at this
		// connection, so a superseded handler never touches its replacement.
		CloseConn(userid, userconn)
	}()

	for {
		select {
		case <-userconn.Done:
			return
		default:
		}

		_, message, err := userconn.WS.ReadMessage()
		if err != nil {
			return
		}
		dmessage, err := DecryptKeyAES(message, userconn.UserInfo, true)
		if err != nil {
			Logger.Error("Error decrypting message:", zap.Error(err))
			return
		}
		var msg models.Message
		if e := json.Unmarshal(dmessage, &msg); e != nil {
			continue
		}
		msg.Epoch = time.Now().Unix()
		if msg.Media == "" && msg.Message == "" {
			continue // empty message
		}
		if msg.To.IsZero() || msg.From != userid || len(msg.Message) > maxTextLength*4 {
			continue // invalid message
		}

		switch msg.Type {
		case models.Ping:
			// handled inline: only the reader goroutine may touch read deadlines
			HandelPingMessage(userid, userconn)
		case models.P2p:
			if len(msg.Message) > maxTextLength || msg.To == userid {
				continue
			}
			msg.ID = primitive.NewObjectID()
			go SendMessagestoUser(msg, msg.To)
			go SendMessagestoSelf(msg, userconn)
			savemsgs <- msg
		case models.Grp:
			if len(msg.Message) > maxTextLength || !isGroupMember(msg.To, userid) {
				continue
			}
			msg.ID = primitive.NewObjectID()
			go SendMessagestoGroup(msg, primitive.NilObjectID)
			savemsgs <- msg
		case models.Typing:
			if isGroupMember(msg.To, userid) {
				go SendMessagestoGroup(msg, userid)
			} else {
				go SendMessagestoUser(msg, msg.To)
			}
		case models.UserOnline:
			go func(msg models.Message) {
				if CheckUserOnline(msg.To) {
					msg.Message = "online"
				} else {
					msg.Message = "offline"
				}
				SendMessagestoSelf(msg, userconn)
			}(msg)
		case models.Call, models.Offer, models.Ice, models.Answer, models.CallEnd:
			if msg.To == userid {
				continue
			}
			go HandleWebrtcOffer(msg)
		default:
		}
	}
}

func isGroupMember(group primitive.ObjectID, user primitive.ObjectID) bool {
	ok, err := CheckRedisSetMemeber(groupKey(group), user.Hex())
	return err == nil && ok
}

// safeWriteMessage acquires the conn's mutex before writing to the WebSocket.
// gorilla/websocket panics on concurrent writes; this prevents that.
func safeWriteMessage(userconn *models.Conn, msgType int, data []byte) error {
	userconn.Mu.Lock()
	defer userconn.Mu.Unlock()
	if userconn.WS == nil {
		return fmt.Errorf("websocket connection is nil")
	}
	userconn.WS.SetWriteDeadline(time.Now().Add(writeTimeout))
	return userconn.WS.WriteMessage(msgType, data)
}

func writeEncrypted(userconn *models.Conn, msg models.Message) error {
	mse, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	ms, err := EncryptKeyAES(mse, userconn.UserInfo, true)
	if err != nil {
		return err
	}
	return safeWriteMessage(userconn, websocket.TextMessage, []byte(ms))
}

func SendMessagestoSelf(msg models.Message, userconn *models.Conn) {
	if err := writeEncrypted(userconn, msg); err != nil {
		Logger.Error("Error sending message:", zap.Error(err))
	}
}

// SendMessagestoUser delivers message to the user `to`, wherever they are
// connected. It returns false when the user is offline; chat messages are then
// queued in the offline collection, signalling messages are dropped.
func SendMessagestoUser(message models.Message, to primitive.ObjectID) (f bool) {
	defer func() {
		if r := recover(); r != nil {
			Logger.Error("Panic occurred in sendMessagetoUser:", zap.Error(fmt.Errorf("%v", r)))
			f = false
		}
	}()

	// user is connected to this instance
	if user, ok := AllConns.Load(to); ok {
		sendUser := user.(*models.Conn)
		if err := writeEncrypted(sendUser, message); err == nil {
			return true
		} else {
			Logger.Error("Error sending message:", zap.Error(err))
			CloseConn(to, sendUser)
		}
	} else if vm, err := GetRedisKeyVal(userVmKey(to)); err == nil && vm != "" && vm != VmId {
		// user is connected to another instance
		if SendMessageToOtherVm(message, to, vm) {
			return true
		}
	}

	if message.Type.Persistent() {
		StoreOfflineMessages(message, to)
	}
	return false
}

// SendMessagestoGroup fans a message out to every member of the group,
// skipping `except` (used so typing indicators are not echoed to the sender).
func SendMessagestoGroup(message models.Message, except primitive.ObjectID) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in sendMessagetoGroup:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	members, err := GetAllRedisSetMemeber(groupKey(message.To))
	if err != nil {
		return
	}
	for _, userid := range members {
		id, err := primitive.ObjectIDFromHex(userid)
		if err != nil || id == except {
			continue
		}
		go SendMessagestoUser(message, id)
	}
}

// save message to db
func SavemessageToDBWorker(collection string) {
	for msg := range savemsgs {
		func() {
			defer func() {
				if f := recover(); f != nil {
					Logger.Error("Panic occurred in savemessageToDB:", zap.Error(fmt.Errorf("%v", f)))
				}
			}()
			if f := MongoAddOncDoc(collection, msg); !f {
				Logger.Error("Error putting message to mongodb", zap.String("id", msg.ID.Hex()))
			}
		}()
	}
}

// streamEnvelope is what travels between instances. The recipient is carried
// separately because for group messages `message.To` is the group, not a user.
type streamEnvelope struct {
	Recipient primitive.ObjectID `json:"recipient"`
	Message   models.Message     `json:"message"`
}

// send message to other vm
func SendMessageToOtherVm(message models.Message, to primitive.ObjectID, vmid string) bool {
	jsonmsg, err := json.Marshal(streamEnvelope{Recipient: to, Message: message})
	if err != nil {
		return false
	}
	if err := WriteStream(string(jsonmsg), "chatzz:"+vmid); err != nil {
		return false
	}
	return true
}

// CloseConn closes conn and forgets it, but only if it is still the user's
// current connection on this instance.
func CloseConn(userid primitive.ObjectID, conn *models.Conn) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in closeConn:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	conn.Stop()
	if conn.WS != nil {
		conn.WS.Close()
	}
	if AllConns.CompareAndDelete(userid, conn) {
		if err := DelRedisKeyIfEquals(userVmKey(userid), VmId); err != nil {
			Logger.Error("Error deleting key:", zap.Error(err))
		}
	}
}

func CloseUserConnection(userid primitive.ObjectID) {
	if conn, ok := AllConns.Load(userid); ok {
		CloseConn(userid, conn.(*models.Conn))
	}
}

func HandelPingMessage(userid primitive.ObjectID, userconn *models.Conn) {
	userconn.Epoch.Store(time.Now().Unix())
	// Extend the read deadline so the connection stays alive as long as pings arrive
	userconn.WS.SetReadDeadline(time.Now().Add(readTimeout))
	if err := writeEncrypted(userconn, models.Message{Type: models.Pong, From: userid}); err != nil {
		Logger.Error("Error sending message:", zap.Error(err))
	}
	if f := SetUserKeyAndExpiry(userid, 300); !f {
		Logger.Error("Error setting user key and expiry")
	}
}

func SetUserKeyAndExpiry(userid primitive.ObjectID, dur int) bool {
	if err := SetRedisKeyValExpiry(userVmKey(userid), VmId, dur); err != nil {
		Logger.Error("Error setting key value:", zap.Error(err))
		return false
	}
	return true
}

func HandleWebrtcOffer(offer models.Message) {
	if offer.Type == models.Call && offer.Message == "offer" {
		if f := SendMessagestoUser(offer, offer.To); !f {
			offer.Message = "offline"
			offer.From, offer.To = offer.To, offer.From
			SendMessagestoUser(offer, offer.To)
		}
		return
	}
	SendMessagestoUser(offer, offer.To)
}

// offlineDoc is a chat message queued for a user who was offline.
type offlineDoc struct {
	ToUser  primitive.ObjectID `bson:"toUser"`
	Message models.Message     `bson:"msg"`
	Epoch   int64              `bson:"epoch"`
}

func StoreOfflineMessages(msg models.Message, to primitive.ObjectID) {
	if f := MongoAddOncDoc("offline", offlineDoc{ToUser: to, Message: msg, Epoch: msg.Epoch}); !f {
		Logger.Error("Error storing offline messages:")
	}
}

func CheckUserOnline(userid primitive.ObjectID) bool {
	vm, err := GetRedisKeyVal(userVmKey(userid))
	return err == nil && vm != ""
}

func GetOfflineMessages(userid primitive.ObjectID) {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred in getOfflineMessages:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	// older documents stored the message at the top level, keyed by "to"
	docs, ok := MongoGetManyDoc("offline", bson.M{"$or": []bson.M{{"toUser": userid}, {"to": userid, "toUser": bson.M{"$exists": false}}}})
	if !ok {
		Logger.Error("Error getting offline messages:")
		return
	}
	if len(docs) == 0 {
		return
	}
	ids := make([]primitive.ObjectID, 0, len(docs))
	msgs := make([]models.Message, 0, len(docs))
	for _, doc := range docs {
		if id, ok := doc["_id"].(primitive.ObjectID); ok {
			ids = append(ids, id)
		}
		src := doc
		if inner, ok := doc["msg"].(bson.M); ok {
			src = inner
		}
		bydata, err := bson.Marshal(src)
		if err != nil {
			continue
		}
		var msg models.Message
		if err := bson.Unmarshal(bydata, &msg); err != nil {
			continue
		}
		msgs = append(msgs, msg)
	}
	// remove first, so a message that fails again is re-queued rather than lost
	if f := MongoDeleteManyDoc("offline", bson.M{"_id": bson.M{"$in": ids}}); !f {
		Logger.Error("Error deleting offline messages:")
		return
	}
	sort.SliceStable(msgs, func(i, j int) bool { return msgs[i].Epoch < msgs[j].Epoch })
	for _, msg := range msgs {
		SendMessagestoUser(msg, userid)
	}
}
