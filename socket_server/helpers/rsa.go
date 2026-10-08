package helpers

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
)

var PrivateKey *rsa.PrivateKey
var PublicKey string

// LoadRsaKey loads the key pair from Redis, or generates and stores a new one
// when it is missing or unreadable. The public key is always derived from the
// private key so the pair can never get out of sync.
func LoadRsaKey() error {
	if pk, err := GetRedisKeyVal("PrivateKey"); err == nil {
		if privateKey := DecodeRsaPrivateKeyPEM(pk); privateKey != nil {
			PrivateKey = privateKey
			PublicKey = EncodeRsaPublicKeyPEM(&privateKey.PublicKey)
			return nil
		}
	}

	privateKey, publicKey := GenerateRsaKey()
	PrivateKey = privateKey
	PublicKey = EncodeRsaPublicKeyPEM(publicKey)

	if err := SetRedisKeyVal("PrivateKey", EncodeRsaPrivateKeyPEM(privateKey)); err != nil {
		return err
	}
	return SetRedisKeyVal("PublicKey", PublicKey)
}

func GenerateRsaKey() (*rsa.PrivateKey, *rsa.PublicKey) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		panic(err)
	}
	publicKey := &privateKey.PublicKey
	return privateKey, publicKey
}

func DecodeRsaPrivateKey(key string) *rsa.PrivateKey {
	block, _ := pem.Decode([]byte(key))
	if block == nil || block.Type != "RSA PRIVATE KEY" {
		return nil
	}
	privateKey, _ := x509.ParsePKCS1PrivateKey(block.Bytes)
	return privateKey
}

func EncodeRsaPrivateKeyPEM(key *rsa.PrivateKey) string {
	// Convert the RSA private key to DER format (binary format)
	der := x509.MarshalPKCS1PrivateKey(key)

	// Create a PEM block with the DER formatted private key
	pemBlock := pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: der,
	}
	// Encode the PEM block into a string
	privateKeyPEM := string(pem.EncodeToMemory(&pemBlock))
	return privateKeyPEM
}
func DecodeRsaPrivateKeyPEM(key string) *rsa.PrivateKey {
	block, _ := pem.Decode([]byte(key))
	if block == nil || block.Type != "RSA PRIVATE KEY" {
		return nil
	}
	// Parse the private key from the DER formatted block
	privateKey, err := x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return nil
	}
	return privateKey
}
func EncodeRsaPublicKeyPEM(key *rsa.PublicKey) string {
	der, _ := x509.MarshalPKIXPublicKey(key)
	pemBlock := pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: der,
	}
	return string(pem.EncodeToMemory(&pemBlock))
}

func DecodeRsaPublicKeyPEM(key string) *rsa.PublicKey {
	block, _ := pem.Decode([]byte(key))
	if block == nil || block.Type != "PUBLIC KEY" {
		return nil
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		return nil
	}
	publicKey, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil
	}
	return publicKey
}

// decrypt data with private key
func DecryptRsaDatabyPrivateKey(encryptedData string) (string, error) {
	if PrivateKey == nil {
		return "", errors.New("rsa private key not loaded")
	}
	// Decode the base64 ciphertext
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		// log.Fatalf("Failed to decode base64 ciphertext: %v", err)
		return "", err
	}
	// Decrypt the ciphertext using the private key
	plaintext, err := rsa.DecryptOAEP(sha256.New(), rand.Reader, PrivateKey, ciphertext, nil)
	if err != nil {
		// log.Fatalf("Failed to decrypt: %v", err)
		return "", err
	}

	return string(plaintext), nil
}

// encrypt data with public key
func EncryptRsaDatabyPublicKey(plaintext string, PublicKey string) (string, error) {

	publicKey := DecodeRsaPublicKeyPEM(PublicKey)
	if publicKey == nil {
		// log.Fatalf("Failed to parse public key")
		return "", nil
	}
	// Encrypt the plaintext using the public key
	encryptedData, err := rsa.EncryptOAEP(sha256.New(), rand.Reader, publicKey, []byte(plaintext), nil)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(encryptedData), nil

}
