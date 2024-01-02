package core

import (
	"fmt"
	"html/template"
	"net/http"
	"time"
)

type StatsData struct {
	StartTime        int64
	Uptime           string
	NumSessions      int32
	NumWSConnections int32
}

var (
	Stats StatsData
)

func getUptime() string {
	// get difference between now and start time
	uptime := time.Now().Unix() - Stats.StartTime

	// convert to hours, minutes, seconds
	hours := uptime / 3600
	uptime -= hours * 3600
	minutes := uptime / 60
	uptime -= minutes * 60
	seconds := uptime

	return fmt.Sprintf("%d hours, %d minutes, %d seconds", hours, minutes, seconds)
}

func ServeStats(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("templates/stats.html"))
	Stats.Uptime = getUptime()
	tmpl.Execute(w, Stats)
}
