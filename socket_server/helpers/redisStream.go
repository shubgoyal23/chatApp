package helpers

import (
	"chatapp/models"
	"encoding/json"
	"fmt"
	"time"

	"github.com/gomodule/redigo/redis"
	"go.uber.org/zap"
)

func InitStream() error {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()

	StreamName := "chatzz:" + VmId
	GrpName := fmt.Sprintf("group:%s", VmId)
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		return er
	}

	if !RedisKeyExists(StreamName) {
		if _, er := rc.Do("XGROUP", "CREATE", StreamName, GrpName, "$", "MKSTREAM"); er != nil {
			return er
		}
	}

	CreateConsumer(fmt.Sprintf("%d", 1))
	// for i := range 3 {
	// 	CreateConsumer(fmt.Sprintf("%d", i))
	// }
	return nil
}

func CreateConsumer(id string) error {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	StreamName := "chatzz:" + VmId
	GrpName := fmt.Sprintf("group:%s", VmId)
	ConsumerName := fmt.Sprintf("consumer:%s", id)
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, er := rc.Do("PING"); er != nil {
		return er
	}
	if _, er := rc.Do("XGROUP", "CREATECONSUMER", StreamName, GrpName, ConsumerName); er != nil {
		return er
	}
	// Wrap ReadStream in a restart loop so it auto-recovers from panics/exits
	go func() {
		for {
			func() {
				defer func() {
					if f := recover(); f != nil {
						Logger.Error("ReadStream panic, restarting:", zap.Error(fmt.Errorf("%v", f)))
					}
				}()
				ReadStream(id)
			}()
			Logger.Error("ReadStream exited, restarting in 2s", zap.String("consumer", id))
			time.Sleep(2 * time.Second)
		}
	}()
	return nil
}

func ReadStream(id string) {
	StreamName := "chatzz:" + VmId
	GrpName := fmt.Sprintf("group:%s", VmId)
	ConsumerName := fmt.Sprintf("consumer:%s", id)

	consecutiveErrors := 0

	for {
		// Get a fresh connection each iteration — never hold a dead conn in a tight loop
		rc := RedigoConn.Get()
		data, er := redis.Values(rc.Do("XREADGROUP", "GROUP", GrpName, ConsumerName, "BLOCK", "30000", "STREAMS", StreamName, ">"))
		rc.Close()

		if er != nil {
			consecutiveErrors++
			// Backoff: sleep longer as errors persist, capped at 5 seconds
			backoff := time.Duration(consecutiveErrors) * time.Second
			if backoff > 5*time.Second {
				backoff = 5 * time.Second
			}
			Logger.Error("ReadStream error, backing off", zap.Error(er), zap.Duration("backoff", backoff))
			time.Sleep(backoff)
			continue
		}
		consecutiveErrors = 0

		if len(data) == 0 || data == nil {
			continue
		}
		// todo: handle data
		if err := HandleStreamData(data[0].([]interface{})); err != nil {
			continue
		}
	}
}

func WriteStream(msg string, streamName string) error {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, err := rc.Do("PING"); err != nil {
		return err
	}
	_, err := rc.Do("XADD", streamName, "*", "msg", msg)
	if err != nil {
		Logger.Error("WriteStream", zap.Error(err))
		return err
	}
	return nil
}

func HandleStreamData(data []interface{}) error {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	data1, er := redis.Values(data, nil)
	if er != nil {
		return er
	}
	data2, er := redis.Values(data1[1].([]interface{}), nil)
	if er != nil {
		return er
	}
	ids := []string{}
	for _, v := range data2 {
		data3, er := redis.Values(v.([]interface{}), nil)
		if er != nil {
			continue
		}
		if len(data3) == 0 || data3 == nil {
			continue
		}
		id, _ := redis.String(data3[0], nil)
		ids = append(ids, id)
		data4, er := redis.Values(data3[1].([]interface{}), nil)
		if er != nil {
			continue
		}
		if len(data4) == 0 || data4 == nil {
			continue
		}
		msg, _ := redis.String(data4[1], nil)
		var m models.Message
		if err := json.Unmarshal([]byte(msg), &m); err != nil {
			Logger.Error("Error unmarshalling message:", zap.Error(err))
			continue
		}
		if f := SendMessagestoUser(m, m.To); !f {
			Logger.Error("Error sending message to user:", zap.Error(fmt.Errorf("%v", f)))
			continue
		}
	}
	// ack the messages
	rc := RedigoConn.Get()
	StreamName := "chatzz:" + VmId
	GrpName := fmt.Sprintf("group:%s", VmId)
	defer rc.Close()
	args := redis.Args{}.Add(StreamName, GrpName).AddFlat(ids)
	if _, er := rc.Do("XACK", args...); er != nil {
		Logger.Error("Error acking message:", zap.Error(er))
		return er
	}
	return nil
}
