package helpers

import (
	"context"
	"fmt"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

func CleaupOnShutDown() {
	fmt.Println("cleaning up on shutdown")
	AllConns.Mu.RLock()
	for _, v := range AllConns.Conn {
		if v.WS != nil {
			v.WS.Close()
		}
		DelRedisKey(fmt.Sprintf("userVm:%s", v.UserInfo.ID))
	}
	RemoveSetMember("VMsRunning", VmId)
	AllConns.Mu.RUnlock()
	kafkaAdmin, err := kafka.NewAdminClient(configMap)
	if err != nil {
		fmt.Println("Error creating admin client:", err)
		return
	}
	kafkaAdmin.Close()
	kafkaAdmin.DeleteTopics(context.TODO(), []string{VmId})
	KafkaProducer.Produce(&kafka.Message{
		TopicPartition: kafka.TopicPartition{Topic: &VmId, Partition: kafka.PartitionAny},
		Key:            []byte(""),
		Value:          []byte(""),
	}, nil)
	KafkaProducer.Flush(1000)
	KafkaProducer.Close()
	KafkaConsumer.Close()
	fmt.Println("cleaning up done, closing server")
}
