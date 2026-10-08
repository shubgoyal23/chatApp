package helpers

import (
	"time"

	"github.com/gomodule/redigo/redis"
)

var RedigoConn *redis.Pool

// RedisPrefix is prepended to every key so several apps can share one Redis
var RedisPrefix string

// RedisKey returns the key with RedisPrefix applied
func RedisKey(key string) string {
	return RedisPrefix + key
}

// init redis
func InitRediGo(host string, username string, pwd string, prefix string) error {
	RedisPrefix = prefix
	pool := &redis.Pool{
		MaxIdle:     10,
		MaxActive:   50,
		IdleTimeout: 240 * time.Second,
		Dial: func() (redis.Conn, error) {
			// AUTH is only sent when a password is set; username "" means the default user
			return redis.Dial("tcp", host,
				redis.DialUsername(username),
				redis.DialPassword(pwd),
			)
		},
		TestOnBorrow: func(c redis.Conn, t time.Time) error {
			if time.Since(t) < time.Minute {
				return nil
			}
			_, err := c.Do("PING")
			return err
		},
	}
	// Test the connection once, and close it properly
	testConn := pool.Get()
	if err := testConn.Err(); err != nil {
		testConn.Close()
		RedigoConn = nil
		return err
	}
	testConn.Close()
	RedigoConn = pool
	return nil
}

// insert data in redis list
func InsertRedisListLPush(key string, val []string) error {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("InsertRedisListLPush", "Redis not connected", er)
		return er
	}
	ar := redis.Args{}.Add(RedisKey(key)).AddFlat(val)
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
	res, err := redis.ByteSlices(rc.Do("RPOP", RedisKey(key), n))
	if err != nil {
		// LogError("GetRedisListRPOP", fmt.Sprintf("Cannot get items from redis list key: %s", key), err)
		return r, err
	}
	r = append(r, res...)
	return r, nil
}

// insert data in redis set
func InsertRedisSet(key string, val ...string) (bool, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("InsertRedisSet", "Redis not connected", er)
		return false, er
	}
	ar := redis.Args{}.Add(RedisKey(key)).AddFlat(val)
	_, err := rc.Do("SADD", ar...)
	if err != nil {
		// LogError("InsertRedisSet", fmt.Sprintf("cannot insert in redis set key: %s with value: %s", key, val), err)
		return false, err
	}
	return true, nil
}

// insert data in redis set
func RemoveSetMember(key string, val string) (bool, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("InsertRedisSet", "Redis not connected", er)
		return false, er
	}
	_, err := rc.Do("SREM", RedisKey(key), val)
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
	ar := redis.Args{}.Add(RedisKey(key)).AddFlat(val)
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
	f, err := rc.Do("SISMEMBER", RedisKey(key), val)
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
	_, err := rc.Do("SREM", RedisKey(key), val)
	if err != nil {
		// LogError("DeleteRedisSetMemeber", fmt.Sprintf("cannot delete in redis set key: %s with value: %s", key, val), err)
		return false, err
	}
	return true, nil
}

// get all redis set member
func GetAllRedisSetMemeber(key string) ([]string, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("DeleteRedisSetMemeber", "Redis not connected", er)
		return nil, er
	}
	members, err := redis.Strings(rc.Do("SMEMBERS", RedisKey(key)))
	if err != nil {
		// LogError("DeleteRedisSetMemeber", fmt.Sprintf("cannot delete in redis set key: %s with value: %s", key, val), err)
		return nil, err
	}
	return members, nil
}

func GetRedisKeyVal(key string) (string, error) {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("GetRedisKeyVal", "Redis not connected", er)
		return "", er
	}
	res, err := redis.String(rc.Do("GET", RedisKey(key)))
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
	_, err := rc.Do("SET", RedisKey(key), val)
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
	_, err := rc.Do("EXPIRE", RedisKey(key), dur)
	if err != nil {
		// LogError("SetRedisKeyVal", fmt.Sprintf("cannot set in redis key: %s with value: %s", key, val), err)
		return err
	}
	return nil
}

func DelRedisKey(key string) error {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("SetRedisKeyVal", "Redis not connected", er)
		return er
	}
	_, err := rc.Do("DEL", RedisKey(key))
	if err != nil {
		// LogError("SetRedisKeyVal", fmt.Sprintf("cannot set in redis key: %s with value: %s", key, val), err)
		return err
	}
	return nil
}

func RedisKeyExists(key string) bool {
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		// LogError("SetRedisKeyVal", "Redis not connected", er)
		return false
	}
	f, err := redis.Bool(rc.Do("EXISTS", RedisKey(key)))
	if err != nil {
		// LogError("SetRedisKeyVal", fmt.Sprintf("cannot set in redis key: %s with value: %s", key, val), err)
		return false
	}
	return f
}
