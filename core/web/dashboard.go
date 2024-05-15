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

package web

import (
	"html/template"
	"net/http"
	"time"

	"git.vrsal.cc/alex/iros/core/util"
	"git.vrsal.cc/alex/iros/core/wss"
)

func dashboardPage(w http.ResponseWriter, r *http.Request) {
	if !checkAuthentification(w, r) {
		return
	}

	tmpl := template.Must(template.ParseFiles("templates/dashboard.html"))
	util.Stats.Uptime = util.GetUptime()
	util.Stats.LastMessage = util.FormatTime(time.Now().Unix() - util.Stats.LastMessageTime)
	util.Stats.InactiveSessions = wss.GetAmountOfSessionsToPurge()
	util.Stats.EmptySessions = wss.GetAmountOfEmptySessionsToPurge()
	util.Stats.NumSessions = int32(len(wss.Instance.Sessions))
	tmpl.Execute(w, util.Stats)
}
