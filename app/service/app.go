package service

import (
	"LineSolv/app/calculator"
)

type AppService struct {
	engine *calculator.Engine
}

func NewAppService() *AppService {
	return &AppService{
		engine: calculator.NewEngine(),
	}
}

func (s *AppService) EvaluateLine(input string) (string, error) {
	return s.engine.EvaluateLine(input)
}

func (s *AppService) EvaluateAll(input string) []string {
	return s.engine.EvaluateAll(input)
}

func (s *AppService) GetVariables() map[string]float64 {
	return s.engine.GetVariables()
}

func (s *AppService) ClearVariables() {
	s.engine.ClearVariables()
}

func (s *AppService) GetHistory() []calculator.HistoryEntry {
	return s.engine.GetHistory()
}

func (s *AppService) ClearHistory() {
	s.engine.ClearHistory()
}
