package helpers

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
)

var PrivateKey *rsa.PrivateKey
var PublicKey string

func LoadRsaKey() {
	pk, err := GetKeyString("PrivateKey")
	if !err {
		privateKey, publicKey := GenerateRsaKey()
		PrivateKey = privateKey
		PublicKey = EncodeRsaPublicKeyPEM(publicKey)

		SetKeyString("PrivateKey", EncodeRsaPrivateKeyPEM(privateKey))
		SetKeyString("PublicKey", EncodeRsaPublicKeyPEM(publicKey))
	}

	PrivateKey = DecodeRsaPrivateKeyPEM(pk)

	puk, err := GetKeyString("PublicKey")
	if !err {
		privateKey, publicKey := GenerateRsaKey()
		PrivateKey = privateKey
		PublicKey = EncodeRsaPublicKeyPEM(publicKey)

		SetKeyString("PrivateKey", EncodeRsaPrivateKeyPEM(privateKey))
		SetKeyString("PublicKey", EncodeRsaPublicKeyPEM(publicKey))
	}
	PublicKey = puk
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
	// Decode the base64 ciphertext
	ciphertext, err := base64.StdEncoding.DecodeString(encryptedData)
	if err != nil {
		// log.Fatalf("Failed to decode base64 ciphertext: %v", err)
		return "", err
	}
	// Decrypt the ciphertext using the private key
	plaintext, err := rsa.DecryptPKCS1v15(rand.Reader, PrivateKey, ciphertext)
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
	encryptedData, err := rsa.EncryptPKCS1v15(rand.Reader, publicKey, []byte(plaintext))
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(encryptedData), nil

}
