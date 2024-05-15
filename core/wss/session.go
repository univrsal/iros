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

package wss

import (
	"encoding/json"
	"log"
	"sort"
	"sync"
	"time"

	"git.vrsal.cc/alex/iros/core/elements"

	"github.com/gorilla/websocket"
)

type IrosConnection struct {
	Conn  *websocket.Conn
	Mutex sync.Mutex
}

type IrosSession struct {
	Mutex       sync.Mutex                  `json:"-"`
	Connections []*IrosConnection           `json:"-"`
	State       map[string]elements.Element `json:"state"`
	ID          string                      `json:"-"`
	// we might want to purge sessions that haven't been connected to in a while at some point
	LastConnectionTime int64 `json:"last_update"`
}

func (session *IrosSession) load_element(t string, data []byte) *elements.Element {
	var new_element elements.Element
	var err error

	switch t {
	case "text":
		new_element = new(elements.TextElement)
		err = json.Unmarshal(data, &new_element)

	case "image":
		new_element = new(elements.ImageElement)
		err = json.Unmarshal(data, &new_element)
	case "timer":
		new_element = new(elements.TimerElement)
		err = json.Unmarshal(data, &new_element)
	case "audio":
		new_element = new(elements.AudioElement)
		err = json.Unmarshal(data, &new_element)
	case "video":
		new_element = new(elements.VideoElement)
		err = json.Unmarshal(data, &new_element)
	case "iframe":
		new_element = new(elements.IFrameElement)
		err = json.Unmarshal(data, &new_element)
	}

	if err != nil {
		log.Println(err)
		return nil
	}
	session.State[new_element.GetId()] = new_element
	return &new_element
}

func GetAmountOfSessionsToPurge() uint32 {

	var sessionsToPurgeCount uint32 = 0
	for _, session := range Instance.Sessions {
		if time.Now().Unix()-session.LastConnectionTime > 60*60*24*7 {
			sessionsToPurgeCount++
		}
	}

	return sessionsToPurgeCount
}

func GetAmountOfEmptySessionsToPurge() uint32 {

	var sessionsToPurgeCount uint32 = 0
	for _, session := range Instance.Sessions {
		if len(session.State) == 0 {
			sessionsToPurgeCount++
		}
	}

	return sessionsToPurgeCount
}

func GetListOfNonEmptySessions() []*IrosSession {

	var nonEmptySessions []*IrosSession

	for _, session := range Instance.Sessions {
		if len(session.State) != 0 {
			nonEmptySessions = append(nonEmptySessions, session)
		}
	}

	// sort sessions by ID
	sort.Slice(nonEmptySessions, func(i, j int) bool {
		return nonEmptySessions[i].ID < nonEmptySessions[j].ID
	})

	return nonEmptySessions
}
