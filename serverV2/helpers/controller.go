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

func UserAuthMiddleware(c *gin.Context) {
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
		fmt.Println("Decoded JWT claims:", claims)
		c.Set("user", claims)
	} else {
		fmt.Println("Invalid token")
	}
	c.Next()
}

func StoreUserPublicKey(c *gin.Context) {
	user, f := c.Get("user")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
	}
	userInfo := user.(models.User)
	var publicKey struct {
		PublicKey string `json:"publicKey"`
	}

	if err := c.ShouldBindJSON(&publicKey); err != nil {
		c.JSON(400, gin.H{
			"error": "Invalid request body",
		})
		return
	}
	if f := SetKeyString(fmt.Sprintf("userpk:%s", userInfo.ID), publicKey.PublicKey); !f {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	sk := uuid.New().String()
	if f := SetKeyString(fmt.Sprintf("usersk:%s", userInfo.ID), sk); !f {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	data, err := EncryptRsaDatabyPublicKey(publicKey.PublicKey, sk)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Public key stored successfully",
		"sk":      data,
	})
}
func GetSecretKeyforUser(c *gin.Context) {
	user, f := c.Get("user")
	if !f {
		c.JSON(401, gin.H{
			"error": "Unauthorized",
		})
	}
	userInfo := user.(models.User)

	sk := uuid.New().String()
	if f := SetKeyString(fmt.Sprintf("usersk:%s", userInfo.ID), sk); !f {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}

	data, ad, err := EncryptKeyAES(sk, userInfo, false)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Internal server error",
		})
		return
	}
	fmt.Println("ad", string(ad))

	c.JSON(200, gin.H{
		"message": "key Fetched successfully",
		"sk":      data,
	})
}
