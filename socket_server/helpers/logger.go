package helpers

import (
	"errors"
	"fmt"

	"github.com/gomodule/redigo/redis"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Logger *zap.Logger

// RedisWriter implements io.Writer and pushes logs to a Redis list
type RedisWriter struct {
	pool *redis.Pool
	key  string
}

func (r *RedisWriter) Write(p []byte) (n int, err error) {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("RedisWriter Write Crashed: ", r)
		}
	}()
	conn := r.pool.Get()
	defer conn.Close()

	_, err = conn.Do("LPUSH", r.key, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func newRedisCore(writer zapcore.WriteSyncer) zapcore.Core {
	encoderCfg := zap.NewProductionEncoderConfig()
	encoderCfg.EncodeTime = zapcore.ISO8601TimeEncoder

	jsonEncoder := zapcore.NewJSONEncoder(encoderCfg)
	return zapcore.NewCore(jsonEncoder, writer, zapcore.InfoLevel)
}

func InitLogger() (*zap.Logger, error) {
	if RedigoConn == nil {
		return nil, errors.New("RedigoConn is nil")
	}
	writer := &RedisWriter{
		pool: RedigoConn,
		key:  "applog",
	}
	core := newRedisCore(zapcore.AddSync(writer))
	logger := zap.New(core, zap.AddCaller())
	defer logger.Sync()
	Logger = logger
	return logger, nil
}
