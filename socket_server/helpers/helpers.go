package helpers

import (
	"context"
	"fmt"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

func CleaupOnShutDown() {
	AllConns.Mu.RLock()
	for _, v := range AllConns.Conn {
		if v.WS != nil {
			v.WS.Close()
		}
		DelRedisKey(fmt.Sprintf("userVm:%s", v.UserInfo.ID))
	}
	AllConns.Mu.RUnlock()
	kafkaAdmin, err := kafka.NewAdminClient(configMap)
	if err != nil {
		fmt.Println("Error creating admin client:", err)
		return
	}
	defer kafkaAdmin.Close()
	kafkaAdmin.DeleteTopics(context.TODO(), []string{VmId})
	KafkaConsumer.Close()
	KafkaProducer.Close()
}
