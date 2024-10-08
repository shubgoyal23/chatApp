package router

import (
	"chatapp/helpers"
	"os"

	"github.com/gin-gonic/gin"
)

func StartRouter() {
	router := gin.Default()
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"PublicKey": helpers.PublicKey,
		})
	})
	router.Run("localhost:" + os.Getenv("PORT"))
}
