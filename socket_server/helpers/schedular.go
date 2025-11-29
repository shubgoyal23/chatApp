package helpers

import (
	"fmt"
	"time"

	"go.uber.org/zap"
)

func InitScheduler() {
	defer func() {
		if r := recover(); r != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", r)))
		}
	}()

	threeMinTicker := time.NewTicker(3 * time.Minute)
	dayTicker := time.NewTicker(24 * time.Hour)
	defer threeMinTicker.Stop()
	defer dayTicker.Stop()
	for {
		select {
		case <-threeMinTicker.C:
			RemoveLostConnections()
		case <-dayTicker.C:
			Logger.Info("Running Scheduler", zap.String("vmid", VmId), zap.Int("active connections", len(AllConns.Conn)))
		}
	}
}
