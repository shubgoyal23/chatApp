package helpers

import (
	"chatapp/models"
	"fmt"

	"github.com/gin-gonic/gin"
)

func StoreUserPublicKey(c *gin.Context) {
	user, f := c.Get("user")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
	}
	userInfo := user.(models.User)
	var publicKey struct {
		PublicKey  string `json:"publicKey"`
		PrivateKey string `json:"privateKey"` // remove this for app
	}

	if err := c.ShouldBindJSON(&publicKey); err != nil {
		c.JSON(400, gin.H{
			"error": "Invalid request body",
		})
		return
	}
	if f := SetRedisKeyVal(fmt.Sprintf("userpk:%s", userInfo.ID), publicKey.PublicKey); f != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	var upk = map[string]string{
		"userId":     userInfo.ID,
		"PrivateKey": publicKey.PrivateKey,
		"PublicKey":  publicKey.PublicKey,
	}
	if e := MongoAddManyDoc("userPrivateKey", []interface{}{upk}); !e {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Public key stored successfully",
	})
}
