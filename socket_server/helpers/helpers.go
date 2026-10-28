package helpers

import (
	"chatapp/models"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CleaupOnShutDown() {
	Logger.Info("cleaning up on shutdown")
	AllConns.Range(func(key, value interface{}) bool {
		conn := value.(*models.Conn)
		if conn.WS != nil {
			// 1012 "service restart" lets clients reconnect to another instance right away
			conn.WS.WriteControl(websocket.CloseMessage,
				websocket.FormatCloseMessage(websocket.CloseServiceRestart, "server restarting"),
				time.Now().Add(time.Second))
		}
		CloseConn(key.(primitive.ObjectID), conn)
		return true
	})
	RemoveSetMember("VMsRunning", VmId)
	// kafkaAdmin, err := kafka.NewAdminClient(configMap)
	// if err != nil {
	// 	fmt.Println("Error creating admin client:", err)
	// 	return
	// }
	// kafkaAdmin.DeleteTopics(context.TODO(), []string{VmId})
	// kafkaAdmin.Close()
	// KafkaProducer.Produce(&kafka.Message{
	// 	TopicPartition: kafka.TopicPartition{Topic: &VmId, Partition: kafka.PartitionAny},
	// 	Key:            []byte(""),
	// 	Value:          []byte(""),
	// }, nil)
	// KafkaProducer.Flush(1000)
	// KafkaProducer.Close()
	// KafkaConsumer.Close()
	Logger.Info("cleaning up done, closing server")
}
