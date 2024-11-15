package router

import (
	"chatapp/helpers"
	"os"

	"github.com/gin-gonic/gin"
)

func StartRouter() {
	gin.SetMode(os.Getenv("GIN_MODE"))
	router := gin.New()
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"PublicKey": helpers.PublicKey,
		})
	})
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"error": "Page not found",
		})
	})
	helpers.SocketInit()
	router.GET("/ws", helpers.UserAuthMiddleware, helpers.SocketConnectionHandler)
	router.Run("localhost:" + os.Getenv("PORT"))
}
