package main

import (
	"chatapp/helpers"
	"chatapp/router"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	// Create a channel to listen for OS signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	// Load environment variables
	godotenv.Load()
	// if err != nil {
	// 	log.Fatalf("Error loading .env file")
	// }
	if cRedis := helpers.InitRediGo(os.Getenv("REDIS_HOST"), os.Getenv("REDIS_PWD")); cRedis != nil {
		log.Fatalf("Error initializing redis")
	}
	if mongo := helpers.MongoInit(os.Getenv("MONGODB_URI"), os.Getenv("MONGO_DB")); !mongo {
		log.Fatalf("Error initializing mongo")
	}
	// ctx, cancel := context.WithCancel(context.Background())
	helpers.RegisterVmid()
	helpers.LoadRsaKey()
	// helpers.KafkaInit()
	go router.StartRouter()
	go helpers.RemoveLostConnections()
	// go helpers.ReadMessageQueue(ctx)

	// shutdown the server
	<-stop
	log.Println("Shutting down server...")
	// cancel()
	helpers.CleaupOnShutDown()
}
