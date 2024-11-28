package helpers

import (
	"context"
	"os"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoConn *mongo.Client
var MongoDb string

func MongoInit() (f bool) {
	f = false

	uri := os.Getenv("MONGO_URI")
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(uri).SetServerAPIOptions(serverAPI)
	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		return
	}
	err = client.Ping(context.TODO(), nil)
	if err != nil {
		return
	}
	MongoConn = client
	MongoDb = os.Getenv("MONGO_DB")
	return true
}

// add doc to mongo db
func MongoAddDoc(collection string, doc []interface{}) (f bool) {
	f = false
	client := MongoConn.Database(MongoDb).Collection(collection)

	ints, err := client.InsertMany(context.TODO(), doc)
	if err != nil {
		return
	}
	if ints.InsertedIDs == nil {
		return
	}
	return true
}
