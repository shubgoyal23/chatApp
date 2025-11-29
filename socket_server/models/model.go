package models

import (
	"sync"

	"github.com/gorilla/websocket"
)

type User struct {
	ID       string `json:"_id" binding:"required"`
	Name     string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required"`
	UserName string `json:"username" binding:"required"`
	KEY      string `json:"key"`
	Epoch    int64  `json:"epoch"`
}

type Conn struct {
	*sync.RWMutex
	WS       *websocket.Conn
	UserInfo User
	Epoch    int64
}

type Message struct {
	ID      string  `json:"id" bson:"message_id"`
	From    string  `json:"from" binding:"required" bson:"from"`
	To      string  `json:"to" binding:"required" bson:"to"`
	Message string  `json:"message" bson:"message"`
	Media   string  `json:"media" bson:"media"`
	Type    MsgType `json:"type" binding:"required" bson:"type"`
	ReplyTo string  `json:"replyTo" bson:"replyTo"`
	Epoch   int64   `json:"epoch" bson:"epoch"`
}

type MsgType string

const (
	P2p        MsgType = "user"
	Grp        MsgType = "group"
	UserOnline MsgType = "useronline" // to send is user is online or offline
	Chat       MsgType = "chat"
	Ping       MsgType = "ping"
	Pong       MsgType = "pong"
	Call       MsgType = "call"
	Offer      MsgType = "offer"
	Answer     MsgType = "answer"
	Ice        MsgType = "candidate"
	CallEnd    MsgType = "callend"
)

// call - offer - for incomming call
// call - busy - if call is busy
// call - recject - if call is rejected
