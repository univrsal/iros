/*
   This file is part of iros
   Copyright (C) 2024 Alex <uni@vrsal.xyz>

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published
   by the Free Software Foundation, version 3 of the License.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
	LastMessage      string
	NumSessions      int32
	NumWSConnections int32
	LastMessageTime  int64
}

var (
	Stats StatsData
)

func formatTime(t int64) string {
	hours := t / 3600
	t -= hours * 3600
	minutes := t / 60
	t -= minutes * 60
	seconds := t

	return fmt.Sprintf("%d hours, %d minutes, %d seconds", hours, minutes, seconds)
}

func getUptime() string {
	// get difference between now and start time
	uptime := time.Now().Unix() - Stats.StartTime

	return formatTime(uptime)
}

func ServeStats(w http.ResponseWriter, r *http.Request) {
	tmpl := template.Must(template.ParseFiles("templates/stats.html"))
	Stats.Uptime = getUptime()
	Stats.LastMessage = formatTime(time.Now().Unix() - Stats.LastMessageTime)
	tmpl.Execute(w, Stats)
}
