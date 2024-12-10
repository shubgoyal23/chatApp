package models

import (
	"sync"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID       string `json:"_id" binding:"required"`
	Name     string `json:"fullName" binding:"required"`
	Email    string `json:"email" binding:"required"`
	UserName string `json:"username" binding:"required"`
	KEY      string `json:"key"`
	Epoch    int64  `json:"epoch"`
}

type WSConn struct {
	Mu   *sync.RWMutex
	Conn map[string]UserConnection
}

type UserConnection struct {
	WS       *websocket.Conn
	UserInfo User
}

type Message struct {
	ID      string  `json:"id"`
	From    string  `json:"from" binding:"required"`
	To      string  `json:"to" binding:"required"`
	Message string  `json:"message"`
	Media   string  `json:"media"`
	Type    MsgType `json:"type" binding:"required"`
	ReplyTo string  `json:"replyTo"`
	Epoch   int64   `json:"epoch"`
}

type MongoMessage struct {
	ID      string             `json:"id"`
	From    primitive.ObjectID `json:"from" binding:"required"`
	To      primitive.ObjectID `json:"to" binding:"required"`
	Message string             `json:"message"`
	Media   string             `json:"media"`
	Type    MsgType            `json:"type" binding:"required"`
	ReplyTo string             `json:"replyTo"`
	Epoch   int64              `json:"epoch"`
}

type MsgType string

const (
	P2p    MsgType = "user"
	Grp    MsgType = "group"
	Chat   MsgType = "chat"
	Ping   MsgType = "ping"
	Offer  MsgType = "offer"
	Answer MsgType = "answer"
	Ice    MsgType = "candidate"
)
