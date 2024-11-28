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
	loggedinuser := router.Group("/api/v2/user", helpers.UserAuthMiddleware)
	{
		loggedinuser.POST("/publickey", helpers.StoreUserPublicKey)
		loggedinuser.POST("/key", helpers.GetSecretKeyforUser)
	}

	router.GET("/ws", helpers.UserAuthMiddlewareWS, helpers.SocketConnectionHandler)
	router.Run("localhost:" + os.Getenv("PORT"))
}
