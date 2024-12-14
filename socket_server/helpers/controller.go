package helpers

import (
	"chatapp/models"
	"encoding/json"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"github.com/google/uuid"
)

func UserAuthMiddlewareRSA(c *gin.Context) {
	tokenS := c.Request.Header.Get("Authorization")
	if tokenS == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	userstr, err := DecryptRsaDatabyPrivateKey(tokenS)
	if err != nil {
		fmt.Println("Error decoding token:", err)
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	var user models.User
	if err := json.Unmarshal([]byte(userstr), &user); err != nil {
		fmt.Println("Error unmarshalling token:", err)
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	c.Set("user", user)
	c.Next()
}
func UserAuthMiddlewareCookie(c *gin.Context) {
	tokenS, err := c.Request.Cookie("accessToken")
	if err != nil {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}
	tokenString := tokenS.Value
	if tokenString == "" {
		c.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	secretKey := []byte(os.Getenv("ACCESS_TOKEN_SECRET"))
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate the algorithm
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})
	if err != nil {
		fmt.Println("Error decoding token:", err)
		return
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// fmt.Println("Decoded JWT claims:", claims)
		c.Set("jwt", claims)
	} else {
		fmt.Println("Invalid token")
	}
	c.Next()
}

func GetSecretKeyforUser(c *gin.Context) {
	user, f := c.Get("user")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	jwtToken, f := c.Get("jwt")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
		return
	}
	jwtInfo := jwtToken.(jwt.MapClaims)
	userInfo := user.(models.User)

	if jwtInfo["_id"] != userInfo.ID {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
	}

	sk := uuid.New().String()
	if f := SetRedisKeyVal(fmt.Sprintf("usersk:%s", userInfo.ID), sk); f != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	if f := SetKeyExpiry(fmt.Sprintf("usersk:%s", userInfo.ID), 86400); f != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	d := map[string]string{
		"key": sk,
	}
	b, _ := json.Marshal(d)

	data, err := EncryptKeyAES(b, userInfo, true)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	// base64Data := base64.StdEncoding.EncodeToString([]byte(data))
	c.JSON(200, gin.H{
		"message": "key Fetched successfully",
		"sk":      data,
	})
}
