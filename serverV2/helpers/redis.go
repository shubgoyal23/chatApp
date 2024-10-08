package helpers

import (
	"context"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func RedisInit() (f bool) {
	f = false
	rdb := redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_HOST"),
		Username: os.Getenv("REDIS_USER"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
	RedisClient = rdb

	_, err := RedisClient.Ping(context.Background()).Result()
	if err != nil {
		return
	}
	return true
}

// f = false if not found or error
func GetKeyString(key string) (s string, f bool) {
	f = false
	s = "NA"
	rs := RedisClient.Get(context.Background(), key).Val()
	if rs == "" {
		return s, f
	}
	return rs, true
}

// f = false if not found or error
func SetKeyString(key string, val string) (f bool) {
	f = false
	if rs := RedisClient.Set(context.Background(), key, val, 0); rs == nil {
		f = true
	}
	return true
}
