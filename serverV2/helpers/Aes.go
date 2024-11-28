package helpers

import (
	"chatapp/models"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
)

func DeriveKeyFromMD5(key string) []byte {
	// Create MD5 hash
	hash := md5.Sum([]byte(key)) // Generates a 16-byte hash
	return hash[:]
}

func EncryptKeyAES(plainText string, user models.User, useKey bool) (string, []byte, error) {
	var key []byte
	if useKey {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s%s", user.ID, user.Email, user.UserName, user.KEY))
	} else {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s", user.ID, user.Email, user.UserName))
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", nil, err
	}

	nonce := make([]byte, 12) // 12-byte nonce for AES-GCM
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", nil, err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", nil, err
	}

	cipherText := aesGCM.Seal(nil, nonce, []byte(plainText), nil)
	return fmt.Sprintf("%x", append(nonce, cipherText...)), nonce, nil
}

func DecryptKeyAES(cipherTextHex string, user models.User, useKey bool) (string, error) {
	var key []byte
	if useKey {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s%s", user.ID, user.Email, user.UserName, user.KEY))
	} else {
		key = DeriveKeyFromMD5(fmt.Sprintf("%s%s%s", user.ID, user.Email, user.UserName))
	}

	cipherText, err := hex.DecodeString(cipherTextHex)
	if err != nil {
		return "", err
	}

	nonce := cipherText[:12]
	cipherText = cipherText[12:]

	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	aesGCM, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	plainText, err := aesGCM.Open(nil, nonce, cipherText, nil)
	if err != nil {
		return "", err
	}

	return string(plainText), nil
}
