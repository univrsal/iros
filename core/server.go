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
	"time"

	"git.vrsal.cc/alex/iros/core/api"
	"git.vrsal.cc/alex/iros/core/util"
	"git.vrsal.cc/alex/iros/core/web"
	"git.vrsal.cc/alex/iros/core/wss"
)

func StartServer(cfg string) {
	wss.Stats.StartTime = time.Now().Unix()
	wss.Stats.LastMessageTime = time.Now().Unix()
	util.LoadConfig(cfg)

	api.RegisterRoutes()
	web.RegisterPages()
	wss.Instance.Start()
}
