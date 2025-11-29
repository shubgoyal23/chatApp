package helpers

import (
	"chatapp/models"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
)

func DeriveKeyFromMD5(key string) []byte {
	// Create MD5 hash
	hash := md5.Sum([]byte(key)) // Generates a 16-byte hash
	return hash[:]
}

func EncryptKeyAES(plainText []byte, user models.User, useKey bool) (string, error) {
	var key []byte
	if useKey {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s%s", user.ID, user.Email, user.UserName, user.KEY))
	} else {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s", user.ID, user.Email, user.UserName))
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, aesGCM.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	cipherText := aesGCM.Seal(nonce, nonce, plainText, nil)
	return base64.StdEncoding.EncodeToString(cipherText), nil
}

func DecryptKeyAES(cipherTextHex []byte, user models.User, useKey bool) ([]byte, error) {
	var key []byte
	if useKey {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s%s", user.ID, user.Email, user.UserName, user.KEY))
	} else {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s", user.ID, user.Email, user.UserName))
	}
	cipherText, err := base64.StdEncoding.DecodeString(string(cipherTextHex))
	if err != nil {
		return []byte{}, err
	}

	// cipherText, err := hex.DecodeString(Text)
	// if err != nil {
	// 	return "", err
	// }

	block, err := aes.NewCipher(key)
	if err != nil {
		return []byte{}, err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return []byte{}, err
	}

	nonceSize := aesGCM.NonceSize()
	if len(cipherText) < nonceSize {
		return []byte{}, fmt.Errorf("ciphertext too short")
	}
	nonce, ciphertext := cipherText[:nonceSize], cipherText[nonceSize:]

	plainText, err := aesGCM.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return []byte{}, err
	}
	return plainText, nil
}
