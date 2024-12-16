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

package api

import (
	"net/http"

	"git.vrsal.cc/alex/iros/core/util"
)

func RegisterRoutes() {
	http.HandleFunc(util.Cfg.WebRoot+"api/v1/purgeSessions", PurgeSessions)
	http.HandleFunc(util.Cfg.WebRoot+"api/v1/purgeEmptySessions", PurgeEmptySessions)
	http.HandleFunc(util.Cfg.WebRoot+"api/v1/setAnnouncement", SetAnnouncement)
}
