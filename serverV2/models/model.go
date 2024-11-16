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
	ID      string `json:"_id"`
	From    string `json:"from" binding:"required"`
	To      string `json:"to" binding:"required"`
	Message string `json:"message"`
	Media   string `json:"media"`
	Type    string `json:"type" binding:"required"`
	ReplyTo string `json:"replyTo"`
}
