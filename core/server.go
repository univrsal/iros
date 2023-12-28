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
	"fmt"
	"log"
	"net/http"

	"git.vrsal.cc/alex/iros/core/elements"
	"github.com/gorilla/websocket"
)

type WebSocketServer struct {
	Sessions map[string]IrosSession
}

var (
	wss WebSocketServer
)

func (s *WebSocketServer) Start() {
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}

	http.HandleFunc(Cfg.WebSocketEndpoint, func(w http.ResponseWriter, r *http.Request) {

		websocket, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		log.Println("Websocket Connected!")
		listen(websocket)
	})

	var ws_url string
	var http_address = fmt.Sprintf("%s:%d", Cfg.HTTPServerAddress, Cfg.HTTPPort)
	if Cfg.UseWSS {
		ws_url = "wss://" + http_address + Cfg.WebSocketEndpoint
	} else {
		ws_url = "ws://" + http_address + Cfg.WebSocketEndpoint
	}
	config_text := fmt.Sprintf(`var config = {WEBSOCKET_URL: "%s", ROOT: "%s"};`, ws_url, Cfg.WebRoot)
	http.HandleFunc(Cfg.WebRoot+"js/config.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		w.Write([]byte(config_text))
	})

	http.Handle(Cfg.WebRoot, http.StripPrefix(Cfg.WebRoot, http.FileServer(http.Dir("./web"))))
	http.ListenAndServe(http_address, nil)
}

func StartServer(cfg string) {
	LoadConfig(cfg)
	wss.Start()
}

func ReturnSuccess(w http.ResponseWriter, data any) {
	fmt.Fprintf(w, `{"success":true,"data":%v}`, data)
}

func listen(conn *websocket.Conn) {
	type Handshake struct {
		Session string `json:"session"`
	}

	for {
		// read a message
		var result Handshake
		err := conn.ReadJSON(&result)
		if err != nil {
			log.Println(err)
			return
		}

		if len(result.Session) < 1 {
			log.Println("Received invalid handshake message")
			continue
		}

		log.Println("Received handshake message: " + result.Session)

		val, present := wss.Sessions[result.Session]
		if present {
			val.Connections = append(val.Connections, conn)
			wss.Sessions[result.Session] = val
			if val.State != nil {
				conn.WriteJSON(val.State)
			}
		} else {
			var newsession IrosSession
			newsession.State = make(map[string]elements.Element)
			newsession.Connections = append(val.Connections, conn)
			wss.Sessions = make(map[string]IrosSession)
			wss.Sessions[result.Session] = newsession
		}

		break
	}

	// Listen/forward messages
	for {
		t, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}

		var objmap map[string]json.RawMessage
		err = json.Unmarshal(p, &objmap)

		if err != nil {
			log.Println(err)
			return
		}

		var session string
		err = json.Unmarshal(objmap["session"], &session)

		if err != nil {
			log.Println(err)
			return
		}

		val, exists := wss.Sessions[session]

		if exists {
			for _, c := range val.Connections {
				// don't send to the sender
				if c == conn {
					continue
				}
				c.WriteMessage(t, p)
			}

			// keep track of session state
			var t string
			err = json.Unmarshal(objmap["type"], &t)

			if err == nil {
				var args map[string]json.RawMessage
				err = json.Unmarshal(objmap["args"], &args)

				if err == nil {
					process_command(&val, t, args, objmap)
				}
			}
		} else {
			log.Println("Received command with invalid session")
		}
	}
}
