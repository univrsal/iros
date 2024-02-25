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
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"runtime/debug"

	"git.vrsal.cc/alex/iros/core/elements"
	"github.com/gorilla/websocket"
)

var Commit = func() string {
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, setting := range info.Settings {
			if setting.Key == "vcs.revision" {
				return setting.Value[:7]
			}
		}
	}
	return "debug"
}()

type WebSocketServer struct {
	Sessions map[string]IrosSession `json:"sessions"`
}

var (
	wss WebSocketServer
)

func (s *WebSocketServer) SaveState() {
	// Marshal the Server instance to JSON.
	jsonBytes, err := json.Marshal(s)
	if err != nil {
		log.Println(err)
		return
	}

	// Write out the JSON bytes to the file.
	err = os.WriteFile(Cfg.SessionsBackupFile, jsonBytes, 0644)
	if err != nil {
		log.Println(err)
		return
	}

	log.Println("Saved state to " + Cfg.SessionsBackupFile)
}

func (s *WebSocketServer) LoadState() {
	if _, err := os.Stat(Cfg.SessionsBackupFile); err != nil {
		return // file doesn't exist
	}

	// read our opened jsonFile as a byte array.
	p, err := os.ReadFile(Cfg.SessionsBackupFile)
	if err != nil {
		log.Println(err)
		return
	}

	log.Println("Loading state...")

	// This is pretty convoluted, I guess using json.RawMessage and a wrapper struct would be better

	var sessions_backup map[string]json.RawMessage
	err = json.Unmarshal(p, &sessions_backup)

	if err != nil {
		log.Println(err)
		return
	}

	// get sessions
	var sessions map[string]json.RawMessage
	err = json.Unmarshal(sessions_backup["sessions"], &sessions)

	if err != nil {
		log.Println(err)
		return
	}

	// create new sessions map
	s.Sessions = make(map[string]IrosSession)

	// create sessions
	for k, v := range sessions {
		var session map[string]json.RawMessage
		err = json.Unmarshal(v, &session)

		if err != nil {
			log.Println(err)
			return
		}

		log.Println("Loading session " + k)

		// get state
		var state map[string]json.RawMessage
		err = json.Unmarshal(session["state"], &state)

		if err != nil {
			log.Println(err)
			return
		}

		var newsession IrosSession

		// create element map
		newsession.State = make(map[string]elements.Element)

		// load elements
		for _, element_json := range state {
			var element map[string]json.RawMessage
			err = json.Unmarshal(element_json, &element)

			if err != nil {
				log.Println(err)
				return
			}

			// get type
			var t string
			err = json.Unmarshal(element["type"], &t)

			if err != nil {
				log.Println(err)
				return
			}
			// load element
			newsession.load_element(t, element_json)
		}
		Stats.NumSessions++
		s.Sessions[k] = newsession
	}

}

func (s *WebSocketServer) Start() {
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	s.Sessions = make(map[string]IrosSession)

	s.LoadState()

	http.HandleFunc(Cfg.WebSocketEndpoint, func(w http.ResponseWriter, r *http.Request) {

		websocket, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}
		log.Println("Websocket Connected!")
		listen(websocket)
	})

	http.HandleFunc(Cfg.WebRoot+"stats", ServeStats)

	var ws_url string
	var http_address = fmt.Sprintf("%s:%d", Cfg.HTTPServerAddress, Cfg.HTTPPort)
	if Cfg.UseWSS {
		ws_url = "wss://" + Cfg.ServerDomain + Cfg.WebSocketEndpoint
	} else {
		ws_url = "ws://" + Cfg.ServerDomain + Cfg.WebSocketEndpoint
	}
	config_text := fmt.Sprintf(`var config = {WEBSOCKET_URL: "%s", ROOT: "%s", COMMIT: "%s"};`, ws_url, Cfg.WebRoot, Commit)
	http.HandleFunc(Cfg.WebRoot+"js/config.js", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/javascript")
		w.Write([]byte(config_text))
	})

	// Create a channel to receive OS signals.
	sigs := make(chan os.Signal, 1)

	// Register the channel to receive SIGINT and SIGTERM signals.
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	// Start a goroutine that will perform cleanup tasks when a signal is received.
	go func() {
		<-sigs

		// Stop the server
		log.Println("Saving state...")
		s.SaveState()

		os.Exit(0)
	}()

	http.Handle(Cfg.WebRoot, http.StripPrefix(Cfg.WebRoot, http.FileServer(http.Dir("./web"))))
	log.Println("IROS is running on http://" + http_address)
	err := http.ListenAndServe(http_address, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func StartServer(cfg string) {
	Stats.StartTime = time.Now().Unix()
	Stats.LastMessageTime = time.Now().Unix()
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

	conn.SetCloseHandler(func(code int, text string) error {
		atomic.AddInt32(&Stats.NumWSConnections, -1)
		return nil
	})

	for {
		// read a message
		var result Handshake
		err := conn.ReadJSON(&result)
		if err != nil {
			log.Println(err)
			return
		}

		if len(result.Session) < 1 {
			log.Println("Received invalid session id for handshake message")
			continue
		}

		// Don't allow short session ids in release for security reasons
		if len(result.Session) != 36 && !Cfg.DebugMode {
			log.Println("Received invalid session for handshake message")
			continue
		}

		log.Println("Received handshake message: " + result.Session)

		val, present := wss.Sessions[result.Session]
		if present {
			val.Connections = append(val.Connections, conn)
			wss.Sessions[result.Session] = val
			if val.State != nil {
				// send state to new connection
				conn.WriteJSON(val.State)
			}
			val.LastConnectionTime = time.Now().Unix()
		} else {
			var newsession IrosSession
			newsession.State = make(map[string]elements.Element)
			newsession.Connections = append(val.Connections, conn)
			newsession.LastConnectionTime = time.Now().Unix()
			wss.Sessions[result.Session] = newsession

			atomic.AddInt32(&Stats.NumSessions, 1)
		}
		atomic.StoreInt64(&Stats.LastMessageTime, val.LastConnectionTime)

		atomic.AddInt32(&Stats.NumWSConnections, 1)
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
