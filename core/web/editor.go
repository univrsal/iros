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
	"strings"

	"git.vrsal.cc/alex/iros/core/util"
)

type editorPageData struct {
	util.Config

	Announcement      string
	AnnouncementTitle string
}

var editorData editorPageData

func SetAnnouncement(title string, announcement string) {
	editorData.Announcement = strings.ReplaceAll(announcement, "\n", "<br>")
	editorData.AnnouncementTitle = title
}

func editorPage(w http.ResponseWriter, _ *http.Request) {
	tmpl := template.Must(template.ParseFiles("templates/editor.html", "templates/header.html", "templates/announcement.html"))
	editorData.Config = util.Cfg
	err := tmpl.Execute(w, editorData)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
