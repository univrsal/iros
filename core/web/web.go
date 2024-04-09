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
	"net/http"

	"git.vrsal.cc/alex/iros/core/util"
)

func HandleFunc(pattern string, handler func(http.ResponseWriter, *http.Request)) {
	http.HandleFunc(util.Cfg.WebRoot+pattern, handler)
	http.HandleFunc(util.Cfg.WebRoot+pattern+"/", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, util.Cfg.WebRoot+pattern, http.StatusMovedPermanently)
	})
}

func RegisterPages() {
	http.HandleFunc(util.Cfg.WebRoot, landingPage)
	HandleFunc("dashboard", dashboardPage)
	HandleFunc("login", loginPage)
	HandleFunc("editor", editorPage)
	HandleFunc("docs", docsPage)
	// the obs browser source will always request <page>/ instead of <page>
	// so we need to handle both cases without redirecting
	http.HandleFunc(util.Cfg.WebRoot+"viewer", viewerPage)
	http.HandleFunc(util.Cfg.WebRoot+"viewer/", viewerPage)
}

func checkAuthentification(w http.ResponseWriter, r *http.Request) bool {
	cookie, err := r.Cookie("authToken")
	if err != nil {
		http.Error(w, "Missing auth token", http.StatusUnauthorized)
		return false
	}

	if cookie.Value != util.Cfg.APIToken {
		http.Error(w, "Invalid auth token", http.StatusUnauthorized)
		return false
	}

	return true
}
