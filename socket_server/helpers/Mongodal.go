package helpers

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var MongoConn *mongo.Client
var MongoDb string

func MongoInit(uri string, dbName string) (f bool) {
	f = false
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
	MongoDb = dbName
	return true
}

// add doc to mongo db
func MongoAddOncDoc(collection string, doc interface{}) (f bool) {
	f = false
	client := MongoConn.Database(MongoDb).Collection(collection)

	ints, err := client.InsertOne(context.TODO(), doc)
	if err != nil {
		return
	}
	if ints.InsertedID == nil {
		return
	}
	return true
}

// add doc to mongo db
func MongoAddManyDoc(collection string, doc []interface{}) (f bool) {
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

// get many doc from mongo db
func MongoGetManyDoc(collection string, filter interface{}) (doc []bson.M, f bool) {
	doc = []bson.M{}
	f = false
	client := MongoConn.Database(MongoDb).Collection(collection)
	cursor, err := client.Find(context.TODO(), filter)
	if err != nil {
		return
	}
	err = cursor.All(context.TODO(), &doc)
	if err != nil {
		return
	}
	return
}
