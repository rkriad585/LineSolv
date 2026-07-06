package service

import (
	"LineSolv/app/calculator"
	"LineSolv/app/plugin"
)

type AppService struct {
	engine *calculator.Engine
	plugin *plugin.PluginRuntime
}

func NewAppService() *AppService {
	eng := calculator.NewEngine()
	return &AppService{
		engine: eng,
		plugin: plugin.NewPluginRuntime(eng),
	}
}

func (s *AppService) LoadPlugins(dirs []string) (int, error) {
	return plugin.LoadPluginDirs(s.plugin, dirs)
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
