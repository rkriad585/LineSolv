package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"LineSolv/app/service"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	svc := service.NewAppService()

	pluginDirs := []string{"plugins", "plugins/CommunityExtensions"}
	if n, err := svc.LoadPlugins(pluginDirs); err != nil {
		log.Printf("Plugin load error: %v", err)
	} else {
		log.Printf("Loaded %d plugin(s)", n)
	}

	err := wails.Run(&options.App{
		Title:  "LineSolv",
		Width:  480,
		Height: 640,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 26, G: 26, B: 46, A: 1},
		Bind: []interface{}{
			svc,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
