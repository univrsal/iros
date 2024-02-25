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
