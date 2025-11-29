package helpers

import (
	"chatapp/models"
	"fmt"
)

func CleaupOnShutDown() {
	Logger.Info("cleaning up on shutdown")
	AllConns.Range(func(key, value interface{}) bool {
		if value.(*models.Conn).WS != nil {
			value.(*models.Conn).WS.Close()
		}
		DelRedisKey(fmt.Sprintf("userVm:%s", value.(*models.Conn).UserInfo.ID))
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
