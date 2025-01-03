package router

import (
	"chatapp/helpers"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func StartRouter() {
	gin.SetMode(os.Getenv("GIN_MODE"))
	router := gin.New()
	helpers.Origins = strings.Split(os.Getenv("CORS_ORIGIN"), ",")
	router.Use(cors.New(cors.Config{
		AllowOrigins:     helpers.Origins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	router.GET("/ping", func(c *gin.Context) {
		c.String(200, "pong"+helpers.VmId)
	})
	router.GET("/publickey", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"publickey": helpers.PublicKey,
		})
	})
	router.NoRoute(func(c *gin.Context) {
		c.JSON(404, gin.H{
			"error": "Page not found",
		})
	})
	loggedinuser := router.Group("/user", helpers.UserAuthMiddlewareCookie, helpers.UserAuthMiddlewareRSA)
	{
		loggedinuser.GET("/key", helpers.GetSecretKeyforUser)
	}

	router.GET("/ws", helpers.UserAuthMiddlewareWS, helpers.SocketConnectionHandler)
	router.Run(":" + os.Getenv("PORT_GIN"))
}
