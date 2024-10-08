package main

import (
	"chatapp/helpers"
	"chatapp/router"
	"log"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	if cRedis := helpers.RedisInit(); !cRedis {
		log.Fatalf("Error initializing redis")
	}
	helpers.LoadRsaKey()
	router.StartRouter()
}
