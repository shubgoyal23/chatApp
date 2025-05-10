package helpers

// import (
// 	"context"
// 	"fmt"
// 	"log"
// 	"os"

// 	"github.com/confluentinc/confluent-kafka-go/v2/kafka"
// )

// var configMap *kafka.ConfigMap
// var KafkaProducer *kafka.Producer
// var KafkaConsumer *kafka.Consumer

// func KafkaInit() {
// 	configMap = &kafka.ConfigMap{
// 		"bootstrap.servers": os.Getenv("KAFKA_BOOTSTRAP"),
// 		"security.protocol": os.Getenv("KAFKA_SERCURITY"),
// 		"sasl.username":     os.Getenv("KAFKA_USERNAME"),
// 		"sasl.password":     os.Getenv("KAFKA_PASSWORD"),
// 		"sasl.mechanism":    os.Getenv("KAFKA_MECHANISM"),
// 	}
// 	adminInit()

// 	produce()
// 	consume()
// }

// func adminInit() {
// 	kafkaAdmin, err := kafka.NewAdminClient(configMap)
// 	if err != nil {
// 		fmt.Println("Error creating admin client:", err)
// 		return
// 	}
// 	defer kafkaAdmin.Close()

// 	// creates a new topic
// 	topicConfig := kafka.TopicSpecification{
// 		Topic:             VmId,
// 		NumPartitions:     1,
// 		ReplicationFactor: 3,
// 	}

// 	res, err := kafkaAdmin.CreateTopics(context.TODO(), []kafka.TopicSpecification{topicConfig})
// 	if err != nil {
// 		fmt.Println("Error creating topic:", err)
// 	}
// 	for _, ev := range res {
// 		if ev.Error.Code() != kafka.ErrNoError {
// 			fmt.Printf("Failed to create topic: %v\n", ev.Error)
// 			return
// 		}
// 	}
// }

// func produce() {
// 	// creates a new producer instance
// 	p, err := kafka.NewProducer(configMap)
// 	if err != nil {
// 		fmt.Println("Error creating producer:", err)
// 		return
// 	}
// 	KafkaProducer = p
// }

// func consume() {
// 	// creates a new consumer and subscribes to your topic
// 	co := configMap
// 	co.SetKey("group.id", "message-queue")
// 	consumer, err := kafka.NewConsumer(co)
// 	if err != nil {
// 		fmt.Println("Error creating consumer:", err)
// 		return
// 	}
// 	if err := consumer.SubscribeTopics([]string{VmId}, nil); err != nil {
// 		fmt.Println("Error subscribing to topic:", err)
// 		return
// 	}

// 	KafkaConsumer = consumer
// }

// func DeleteAllKafkaTopics() {
// 	KafkaConsumer, err := kafka.NewProducer(configMap)
// 	if err != nil {
// 		fmt.Println("Error creating producer:", err)
// 		return
// 	}
// 	metadata, err := KafkaConsumer.GetMetadata(nil, true, 1000)
// 	if err != nil {
// 		log.Fatalf("Failed to list topics: %v", err)
// 	}

// 	var topicNames []string
// 	for _, topic := range metadata.Topics {
// 		topicNames = append(topicNames, topic.Topic)
// 	}
// 	adminClient, err := kafka.NewAdminClient(configMap)
// 	if err != nil {
// 		fmt.Println("Error creating admin client:", err)
// 		return
// 	}
// 	defer adminClient.Close()
// 	_, errd := adminClient.DeleteTopics(context.Background(), topicNames)
// 	if errd != nil {
// 		fmt.Printf("Failed to delete topics: %v", err)
// 	}
// }
