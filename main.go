package main

import (
	"embed"
	"log"
	"os"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"LineSolv/app/service"
	"LineSolv/app/storage"
)

var version = "dev"

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	db, err := storage.NewDB()
	if err != nil {
		log.Printf("Failed to init storage: %v", err)
		os.Exit(1)
	}
	defer db.Close()

	svc := service.NewAppService(db)

	err = wails.Run(&options.App{
		Title:     "LineSolv",
		Width:     900,
		Height:    540,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		Bind: []interface{}{
			svc,
		},
		OnStartup: service.SetAppContext,
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
		Linux: &linux.Options{
			WindowIsTranslucent: true,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
		},
	})

	if err != nil {
		log.Printf("LineSolv error: %v", err)
	}
}
