package main

import (
	"embed"
	"log"
	"os"

	"LineSolv/app/service"
	"LineSolv/app/storage"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

var version = "dev"

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:docs
var docsFS embed.FS

//go:embed build/appicon.png
var appIcon []byte

func main() {
	db, err := storage.NewDB()
	if err != nil {
		log.Printf("Failed to init storage: %v", err)
		os.Exit(1)
	}
	defer db.Close()

	docs := make(map[string]string)
	entries, err := docsFS.ReadDir("docs")
	if err == nil {
		for _, e := range entries {
			if !e.IsDir() {
				data, rErr := docsFS.ReadFile("docs/" + e.Name())
				if rErr == nil {
					docs[e.Name()] = string(data)
				}
			}
		}
	}

	svc := service.NewAppService(db)
	svc.SetDocs(docs)

	err = wails.Run(&options.App{
		Title:     "LineSolv",
		Width:     900,
		Height:    540,
		Frameless: true,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 0, G: 0, B: 0, A: 0},
		DragAndDrop: &options.DragAndDrop{
			DisableWebViewDrop: true,
		},
		Bind: []interface{}{
			svc,
		},
		OnStartup: service.SetAppContext,
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
		Linux: &linux.Options{
			WindowIsTranslucent: true,
			Icon:                appIcon,
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
