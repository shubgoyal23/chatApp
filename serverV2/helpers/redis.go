// package helpers

// import (
// 	"context"
// 	"os"
// 	"time"

// 	"github.com/redis/go-redis/v9"
// )

// var RedisClient *redis.Client

// func RedisInit() (f bool) {
// 	f = false
// 	rdb := redis.NewClient(&redis.Options{
// 		Addr:     os.Getenv("REDIS_HOST"),
// 		Username: os.Getenv("REDIS_USER"),
// 		Password: os.Getenv("REDIS_PASSWORD"),
// 		DB:       0,
// 	})
// 	RedisClient = rdb

// 	_, err := RedisClient.Ping(context.Background()).Result()
// 	if err != nil {
// 		return
// 	}
// 	return true
// }

// // f = false if not found or error
// func GetKeyString(key string) (s string, f bool) {
// 	f = false
// 	s = "NA"
// 	rs := RedisClient.Get(context.Background(), key).Val()
// 	if rs == "" {
// 		return s, f
// 	}
// 	return rs, true
// }

// // f = false if not found or error
// func SetKeyString(key string, val string) (f bool) {
// 	f = false
// 	if rs := RedisClient.Set(context.Background(), key, val, 0); rs == nil {
// 		f = true
// 	}
// 	return
// }

// // f = false if not found or error
// func SetKeyExpiry(key string, exp time.Duration) (f bool) {
// 	f = false
// 	if rs := RedisClient.Expire(context.Background(), key, exp); rs == nil {
// 		f = true
// 	}
// 	return
// }

// func SetUserSocketId(userid string) (f bool) {
// 	f = false
// 	_, err := RedisClient.Ping(context.Background()).Result()
// 	if err != nil {
// 		return
// 	}
// 	if rs := RedisClient.Set(context.Background(), "chatuser:"+userid, VmId, 0); rs == nil {
// 		f = true
// 	}
// 	RedisClient.Expire(context.Background(), "chatuser:"+userid, 5*time.Minute)
// 	return true
// }

package helpers

import (
	"github.com/gomodule/redigo/redis"
)

var RedigoConn *redis.Pool

// init redis
func InitRediGo(r string, pwd string) error {
	pool := &redis.Pool{
		Dial: func() (redis.Conn, error) {
			conn, err := redis.Dial("tcp", r)
			if err != nil {
				//log to local as could not connect to Redis
				return nil, err
			}
			if _, err := conn.Do("AUTH", pwd); err != nil {
				conn.Close()
				return nil, err
			}
			return conn, nil
		},
	}
	if pool.Get().Err() != nil {
		RedigoConn = nil
		return pool.Get().Err()
	} else {
		RedigoConn = pool
		return nil
	}
}

// insert data in redis list
func InsertRedisListLPush(key string, val []string) error {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("InsertRedisListLPush", "Redis not connected", er)
		return er
	}
	ar := redis.Args{}.Add(key).AddFlat(val)
	_, err := rc.Do("LPUSH", ar...)
	if err != nil {
		// LogError("InsertRedisListLPush", fmt.Sprintf("cannot insert in redis list key: %s with value: %s", key, val), err)
		return err
	}
	return nil
}

// insert data in redis list
func GetRedisListRPOP(key string, n int) ([][]byte, error) {
	r := [][]byte{}
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("GetRedisListRPOP", "Redis not connected", er)
		return r, er
	}
	res, err := redis.ByteSlices(rc.Do("RPOP", key, n))
	if err != nil {
		// LogError("GetRedisListRPOP", fmt.Sprintf("Cannot get items from redis list key: %s", key), err)
		return r, err
	}
	r = append(r, res...)
	return r, nil
}

// insert data in redis set
func InsertRedisSet(key string, val string) (bool, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("InsertRedisSet", "Redis not connected", er)
		return false, er
	}
	_, err := rc.Do("SADD", key, val)
	if err != nil {
		// LogError("InsertRedisSet", fmt.Sprintf("cannot insert in redis set key: %s with value: %s", key, val), err)
		return false, err
	}
	return true, nil
}

// insert data in redis set
func InsertRedisSetBulk(key string, val []string) (bool, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("InsertRedisSetBulk", "Redis not connected", er)
		return false, er
	}
	ar := redis.Args{}.Add(key).AddFlat(val)
	_, err := rc.Do("SADD", ar...)
	if err != nil {
		// LogError("InsertRedisSetBulk", fmt.Sprintf("cannot insert in redis set key: %s with value: %s", key, val), err)
		return false, err
	}
	return true, nil
}

// check if data exists in redis set
func CheckRedisSetMemeber(key string, val string) (bool, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("CheckRedisSetMemeber", "Redis not connected", er)
		return false, er
	}
	f, err := rc.Do("SISMEMBER", key, val)
	if err != nil {
		// LogError("CheckRedisSetMemeber", fmt.Sprintf("cannot check in redis set key: %s with value: %s", key, val), err)
		return false, err
	}
	if f.(int64) < 1 {
		return false, nil
	}
	return true, nil
}

// delete redis set member
func DeleteRedisSetMemeber(key string, val string) (bool, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("DeleteRedisSetMemeber", "Redis not connected", er)
		return false, er
	}
	_, err := rc.Do("SREM", key, val)
	if err != nil {
		// LogError("DeleteRedisSetMemeber", fmt.Sprintf("cannot delete in redis set key: %s with value: %s", key, val), err)
		return false, err
	}
	return true, nil
}

func GetRedisKeyVal(key string) (string, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("GetRedisKeyVal", "Redis not connected", er)
		return "", er
	}
	res, err := redis.String(rc.Do("GET", key))
	if err != nil {
		// LogError("GetRedisKeyVal", fmt.Sprintf("cannot get in redis key: %s", key), err)
		return "", err
	}
	return res, nil
}

func SetRedisKeyVal(key string, val string) error {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("SetRedisKeyVal", "Redis not connected", er)
		return er
	}
	_, err := rc.Do("SET", key, val)
	if err != nil {
		// LogError("SetRedisKeyVal", fmt.Sprintf("cannot set in redis key: %s with value: %s", key, val), err)
		return err
	}
	return nil
}
func SetKeyExpiry(key string, dur int) error {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("SetRedisKeyVal", "Redis not connected", er)
		return er
	}
	_, err := rc.Do("EXPIRE", key, dur)
	if err != nil {
		// LogError("SetRedisKeyVal", fmt.Sprintf("cannot set in redis key: %s with value: %s", key, val), err)
		return err
	}
	return nil
}
