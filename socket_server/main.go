package main

import (
	"chatapp/helpers"
	"chatapp/router"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"go.uber.org/zap"
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
	logger, err := helpers.InitLogger()
	if err != nil {
		log.Fatalf("Error initializing logger: %v", err)
	}
	// ctx, cancel := context.WithCancel(context.Background())
	helpers.RegisterVmid()
	logger.Info("VM ID registered", zap.String("vmid", helpers.VmId))
	helpers.LoadRsaKey()
	// helpers.KafkaInit()
	if err := helpers.InitStream(); err != nil {
		log.Fatalf("Error initializing stream: %v", err)
	}
	go router.StartRouter()
	go helpers.RemoveLostConnections()
	// go helpers.ReadMessageQueue(ctx)

	// shutdown the server
	<-stop
	logger.Info("Shutting down server...")
	// cancel()
	helpers.CleaupOnShutDown()
}
