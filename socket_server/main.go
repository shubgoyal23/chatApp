package main

import (
	"chatapp/helpers"
	"chatapp/router"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	if cRedis := helpers.InitRediGo(os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PWD")); cRedis != nil {
		log.Fatalf("Error initializing redis")
	}
	if mongo := helpers.MongoInit(os.Getenv("MONGODB_URI"), os.Getenv("MONGO_DB")); !mongo {
		log.Fatalf("Error initializing mongo")
	}
	helpers.LoadRsaKey()
	router.StartRouter()
}
