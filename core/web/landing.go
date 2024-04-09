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

func landingPage(w http.ResponseWriter, r *http.Request) {
	// check if the request path starts with the static path
	if strings.HasPrefix(r.URL.Path, util.Cfg.WebRoot+"static/") {
		http.StripPrefix(util.Cfg.WebRoot+"static", http.FileServer(http.Dir("static"))).ServeHTTP(w, r)
		return
	}

	if r.URL.Path != util.Cfg.WebRoot {
		notFoundPage(w, r)
		return
	}

	tmpl := template.Must(template.ParseFiles("templates/landing.html", "templates/header.html"))
	tmpl.Execute(w, util.Cfg)
}
