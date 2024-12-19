package helpers

import (
	"context"
	"fmt"
	"os"

	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
)

var configMap *kafka.ConfigMap
var KafkaProducer *kafka.Producer
var KafkaConsumer *kafka.Consumer

func KafkaInit() {
	configMap = &kafka.ConfigMap{
		"bootstrap.servers": os.Getenv("KAFKA_BOOTSTRAP"),
		"security.protocol": os.Getenv("KAFKA_SERCURITY"),
		"sasl.username":     os.Getenv("KAFKA_USERNAME"),
		"sasl.password":     os.Getenv("KAFKA_PASSWORD"),
		"sasl.mechanism":    os.Getenv("KAFKA_MECHANISM"),
	}
	adminInit()

	produce()
	consume()
}

func adminInit() {
	kafkaAdmin, err := kafka.NewAdminClient(configMap)
	if err != nil {
		fmt.Println("Error creating admin client:", err)
		return
	}
	defer kafkaAdmin.Close()

	// creates a new topic
	topicConfig := kafka.TopicSpecification{
		Topic:             VmId,
		NumPartitions:     1,
		ReplicationFactor: 3,
	}

	res, err := kafkaAdmin.CreateTopics(context.TODO(), []kafka.TopicSpecification{topicConfig})
	if err != nil {
		fmt.Println("Error creating topic:", err)
	}
	for _, ev := range res {
		if ev.Error.Code() != kafka.ErrNoError {
			fmt.Printf("Failed to create topic: %v\n", ev.Error)
			return
		}
	}
}

func produce() {
	// creates a new producer instance
	p, err := kafka.NewProducer(configMap)
	if err != nil {
		fmt.Println("Error creating producer:", err)
		return
	}
	KafkaProducer = p

	// go-routine to handle message delivery reports and
	// possibly other event types (errors, stats, etc)
	// go func() {
	// 	for e := range p.Events() {
	// 		switch ev := e.(type) {
	// 		case *kafka.Message:
	// 			if ev.TopicPartition.Error != nil {
	// 				fmt.Printf("Failed to deliver message: %v\n", ev.TopicPartition)
	// 			} else {
	// 				fmt.Printf("Produced event to topic %s: key = %-10s value = %s\n",
	// 					*ev.TopicPartition.Topic, string(ev.Key), string(ev.Value))
	// 			}
	// 		}
	// 	}
	// }()

	// produces a sample message to the user-created topic
	// p.Produce(&kafka.Message{
	// 	TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
	// 	Key:            []byte("key"),
	// 	Value:          []byte("value"),
	// }, nil)

	// send any outstanding or buffered messages to the Kafka broker and close the connection
	// p.Flush(15 * 1000)
	// p.Close()
}

func consume() {
	// creates a new consumer and subscribes to your topic
	co := configMap
	co.SetKey("group.id", "message-queue")
	consumer, err := kafka.NewConsumer(co)
	if err != nil {
		fmt.Println("Error creating consumer:", err)
		return
	}
	if err := consumer.SubscribeTopics([]string{VmId}, nil); err != nil {
		fmt.Println("Error subscribing to topic:", err)
		return
	}

	KafkaConsumer = consumer

	// run := true
	// for run {
	// 	// consumes messages from the subscribed topic and prints them to the console
	// 	e := consumer.Poll(1000)
	// 	switch ev := e.(type) {
	// 	case *kafka.Message:
	// 		// application-specific processing
	// 		fmt.Printf("Consumed event from topic %s: key = %-10s value = %s\n",
	// 			*ev.TopicPartition.Topic, string(ev.Key), string(ev.Value))
	// 	case kafka.Error:
	// 		fmt.Fprintf(os.Stderr, "%% Error: %v\n", ev)
	// 		run = false
	// 	}
	// }
}
