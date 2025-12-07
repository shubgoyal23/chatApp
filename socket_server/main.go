package main

import (
	"chatapp/helpers"
	"chatapp/router"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
)

func main() {
	// Create a channel to listen for OS signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)
	go func() {
		log.Println("pprof listening on :6060")
		if err := http.ListenAndServe("localhost:6060", nil); err != nil {
			log.Println("pprof server error:", err)
		}
	}()
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
	logger, err := helpers.InitLogger("chatapplog")
	if err != nil {
		log.Fatalf("Error initializing logger: %v", err)
	}
	// ctx, cancel := context.WithCancel(context.Background())
	helpers.RegisterVmid(os.Getenv("VM_ID"))
	helpers.LoadRsaKey()
	// helpers.KafkaInit()
	if err := helpers.InitStream(); err != nil {
		log.Fatalf("Error initializing stream: %v", err)
	}
	go router.StartRouter()
	// go helpers.ReadMessageQueue(ctx)

	// run scheduler
	go helpers.InitScheduler()

	// shutdown the server
	<-stop
	logger.Info("Shutting down server...")
	// cancel()
	helpers.CleaupOnShutDown()
}
