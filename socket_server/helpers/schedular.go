package helpers

import (
	"fmt"
	"time"

	"go.uber.org/zap"
)

func DoEveryDay() {
	go func() {
		if r := recover(); r != nil {
			Logger.Error("Panic occurred:", zap.Error(fmt.Errorf("%v", r)))
		}
	}()
	for range time.Tick(time.Hour * 24) {
		Logger.Info("Running DoEveryDay")
	}
}
