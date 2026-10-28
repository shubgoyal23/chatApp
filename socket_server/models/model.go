package models

import (
	"sync"
	"sync/atomic"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID       primitive.ObjectID `json:"_id" binding:"required"`
	Name     string             `json:"fullName" binding:"required"`
	Email    string             `json:"email" binding:"required"`
	UserName string             `json:"username" binding:"required"`
	KEY      string             `json:"key"`
	Epoch    int64              `json:"epoch"`
}

// Session is what the socket server stores in Redis when it hands out a
// session key, so the websocket handshake can verify the caller holds it.
type Session struct {
	Key      string `json:"key"`
	Email    string `json:"email"`
	UserName string `json:"username"`
}

type Conn struct {
	Mu       sync.Mutex
	WS       *websocket.Conn
	UserInfo User
	// Epoch is the unix time of the last ping; read by the scheduler while the
	// reader goroutine updates it, so it must be accessed atomically.
	Epoch    atomic.Int64
	Done     chan struct{}
	doneOnce sync.Once
}

// Stop signals the connection's reader goroutine that it has been superseded.
func (c *Conn) Stop() {
	c.doneOnce.Do(func() { close(c.Done) })
}

type Message struct {
	ID      primitive.ObjectID  `json:"_id" bson:"_id,omitempty"`
	From    primitive.ObjectID  `json:"from" binding:"required" bson:"from"`
	To      primitive.ObjectID  `json:"to" binding:"required" bson:"to"`
	Message string              `json:"message" bson:"message"`
	Media   string              `json:"media" bson:"media"`
	Type    MsgType             `json:"type" binding:"required" bson:"type"`
	ReplyTo *primitive.ObjectID `json:"replyTo" bson:"replyTo"`
	Epoch   int64               `json:"epoch" bson:"epoch"`
}

type MsgType string

const (
	P2p        MsgType = "user"
	Grp        MsgType = "group"
	UserOnline MsgType = "useronline" // to send is user is online or offline
	Chat       MsgType = "chat"
	Ping       MsgType = "ping"
	Pong       MsgType = "pong"
	Typing     MsgType = "typing"
	Call       MsgType = "call"
	Offer      MsgType = "offer"
	Answer     MsgType = "answer"
	Ice        MsgType = "candidate"
	CallEnd    MsgType = "callend"
)

// Persistent reports whether a message of this type is a chat message that
// must be saved and queued for offline users. Signalling messages (calls,
// typing, presence) are only useful while both sides are online.
func (t MsgType) Persistent() bool {
	return t == P2p || t == Grp
}

// call - offer - for incomming call
// call - busy - if call is busy
// call - recject - if call is rejected
