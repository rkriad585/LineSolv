//go:build dev

package app

import (
	"log"
	"net/http"
	"net/http/pprof"
)

func init() {
	mux := http.NewServeMux()
	mux.HandleFunc("/debug/pprof/", pprof.Index)
	mux.HandleFunc("/debug/pprof/cmdline", pprof.Cmdline)
	mux.HandleFunc("/debug/pprof/profile", pprof.Profile)
	mux.HandleFunc("/debug/pprof/symbol", pprof.Symbol)
	mux.HandleFunc("/debug/pprof/trace", pprof.Trace)

	server := &http.Server{Addr: "localhost:6060", Handler: mux}
	go func() {
		log.Println("[pprof] listening on http://localhost:6060/debug/pprof/")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[pprof] server error: %v", err)
		}
	}()
}
