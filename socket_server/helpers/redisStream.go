package helpers

import (
	"fmt"

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
	if _, er := rc.Do("XGROUP CREATE", StreamName, GrpName, "$", "MKSTREAM"); er != nil {
		return er
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
	if _, er := rc.Do("XGROUP CREATECONSUMER", StreamName, GrpName, ConsumerName); er != nil {
		return er
	}
	return nil
}

func ReadStream(id string) {
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
		return
	}
	for {
		if rc == nil {
			rc = RedigoConn.Get()
		}
		data, er := redis.Values(rc.Do("XREADGROUP", "GROUP", GrpName, "CONSUMER", ConsumerName, "BLOCK", "3000", "STREAMS", StreamName, ">"))
		if er != nil {
			Logger.Error("ReadStream", zap.Error(er))
			return
		}
		if len(data) == 0 || data == nil {
			continue
		}
	}
}

func WriteStream(msg string) error {
	defer func() {
		if f := recover(); f != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", f)))
		}
	}()
	StreamName := "chatzz:" + VmId
	rc := RedigoConn.Get()
	defer rc.Close()
	if _, err := rc.Do("PING"); err != nil {
		return err
	}
	_, err := rc.Do("XADD", StreamName, "*", "msg", msg)
	if err != nil {
		Logger.Error("WriteStream", zap.Error(err))
		return err
	}
	return nil
}
