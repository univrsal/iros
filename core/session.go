/*
   This file is part of iros
   Copyright (C) 2023 Alex <uni@vrsal.xyz>

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
	"encoding/json"
	"log"

	"git.vrsal.cc/alex/iros/core/elements"
	"github.com/gorilla/websocket"
)

type IrosSession struct {
	Connections []*websocket.Conn           `json:"-"`
	State       map[string]elements.Element `json:"state"`
	// we might want to purge sessions that haven't been connected to in a while at some point
	LastConnectionTime int64 `json:"last_update"`
}

func (session *IrosSession) load_element(t string, data []byte) *elements.Element {
	switch t {
	case "text":
		e := new(elements.TextElement)
		err := json.Unmarshal(data, &e)

		if err != nil {
			log.Println(err)
			return nil
		}
		session.State[e.Id] = e
	case "image":
		e := new(elements.ImageElement)
		err := json.Unmarshal(data, &e)

		if err != nil {
			log.Println(err)
			return nil
		}
		session.State[e.Id] = e
	case "timer":
		e := new(elements.TimerElement)
		err := json.Unmarshal(data, &e)

		if err != nil {
			log.Println(err)
			return nil
		}
		session.State[e.Id] = e
	}
	return nil
}
