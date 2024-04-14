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
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync/atomic"
	"syscall"
	"time"

	"git.vrsal.cc/alex/iros/core/elements"
	"git.vrsal.cc/alex/iros/core/util"
	"github.com/gorilla/websocket"
)

type WebSocketServer struct {
	Sessions map[string]*IrosSession `json:"sessions"`
}

var (
	Instance WebSocketServer
)

func (s *WebSocketServer) SaveState() {
	// Marshal the Server instance to JSON.
	jsonBytes, err := json.Marshal(s)
	if err != nil {
		log.Println(err)
		return
	}

	// Write out the JSON bytes to the file.
	err = os.WriteFile(util.Cfg.SessionsBackupFile, jsonBytes, 0644)
	if err != nil {
		log.Println(err)
		return
	}

	log.Println("Saved state to " + util.Cfg.SessionsBackupFile)
}

func (s *WebSocketServer) LoadState() {
	if _, err := os.Stat(util.Cfg.SessionsBackupFile); err != nil {
		return // file doesn't exist
	}

	// read our opened jsonFile as a byte array.
	p, err := os.ReadFile(util.Cfg.SessionsBackupFile)
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
	s.Sessions = make(map[string]*IrosSession)

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

		newsession := new(IrosSession)

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
		util.Stats.NumSessions++
		s.Sessions[k] = newsession
	}

}

func listen(conn *websocket.Conn) {
	type Handshake struct {
		Session string `json:"session"`
	}

	conn.SetCloseHandler(func(code int, text string) error {
		atomic.AddInt32(&util.Stats.NumWSConnections, -1)
		return nil
	})

	for {
		// read a message
		var result Handshake
		err := conn.ReadJSON(&result)
		if err != nil {
			atomic.AddInt32(&util.Stats.NumWSConnections, -1)
			return
		}

		if len(result.Session) < 1 {
			log.Println("Received invalid session id for handshake message")
			continue
		}

		// Don't allow short session ids in release for security reasons
		if len(result.Session) != 36 && !util.Cfg.DebugMode {
			log.Println("Received invalid session for handshake message")
			continue
		}

		log.Println("Received handshake message: " + result.Session)

		val, present := Instance.Sessions[result.Session]
		if present {
			val.Mutex.Lock()
			newconnection := new(IrosConnection)
			newconnection.Conn = conn
			val.Connections = append(val.Connections, newconnection)
			Instance.Sessions[result.Session] = val
			if val.State != nil {
				// send state to new connection
				err := conn.WriteJSON(val.State)
				if err != nil {
					log.Println(err)
					return
				}
			}
			val.LastConnectionTime = time.Now().Unix()
			val.Mutex.Unlock()
		} else {
			newsession := new(IrosSession)
			newsession.Connections = make([]*IrosConnection, 0)
			newconnection := new(IrosConnection)
			newconnection.Conn = conn
			newsession.State = make(map[string]elements.Element)
			newsession.Connections = append(newsession.Connections, newconnection)
			newsession.LastConnectionTime = time.Now().Unix()
			Instance.Sessions[result.Session] = newsession

			atomic.AddInt32(&util.Stats.NumSessions, 1)
			val = newsession
		}
		atomic.StoreInt64(&util.Stats.LastMessageTime, val.LastConnectionTime)

		atomic.AddInt32(&util.Stats.NumWSConnections, 1)
		break
	}

	// Listen/forward messages
	for {
		t, p, err := conn.ReadMessage()
		if err != nil {
			if closeErr, ok := err.(*websocket.CloseError); ok {
				if closeErr.Code == websocket.CloseAbnormalClosure {
					// this type of disconnect does not trigger the close handler
					// so we need to decrement the connection count here
					// also it happens a lot so we don't need to log it
					atomic.AddInt32(&util.Stats.NumWSConnections, -1)
				} else {
					log.Println(err)
				}
			} else {
				log.Println(err)
			}
			break
		}

		var objmap map[string]json.RawMessage
		err = json.Unmarshal(p, &objmap)

		if err != nil {
			log.Println(err)
			continue
		}

		var session string
		err = json.Unmarshal(objmap["session"], &session)

		if err != nil {
			log.Println(err)
			continue
		}

		val, exists := Instance.Sessions[session]

		if exists {
			val.Mutex.Lock()
			length := len(val.Connections)
			// loop with length
			for i := 0; i < length; i++ {
				c := val.Connections[i]
				// don't send to the sender
				if c.Conn == conn {
					continue
				}
				c.Mutex.Lock()
				err := c.Conn.WriteMessage(t, p)
				c.Mutex.Unlock()

				if err != nil {
					// Remove the failed connection from the slice

					val.Connections = append(val.Connections[:i], val.Connections[i+1:]...)
					length--
				}
			}
			val.Mutex.Unlock()

			// keep track of session state
			var t string
			err = json.Unmarshal(objmap["type"], &t)

			if err == nil {
				var args map[string]json.RawMessage
				err = json.Unmarshal(objmap["args"], &args)

				if err == nil {
					process_command(val, t, args, objmap)
				}
			}
		} else {
			log.Println("Received command with invalid session")
		}
	}
}

func (s *WebSocketServer) Start() {
	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
	upgrader.HandshakeTimeout = 10 * time.Second
	s.Sessions = make(map[string]*IrosSession)

	s.LoadState()

	var ws_url string
	var http_address = fmt.Sprintf("%s:%d", util.Cfg.HTTPServerAddress, util.Cfg.HTTPPort)
	if util.Cfg.UseWSS {
		ws_url = "wss://" + util.Cfg.ServerDomain + util.Cfg.WebSocketEndpoint
	} else {
		ws_url = "ws://" + util.Cfg.ServerDomain + util.Cfg.WebSocketEndpoint
	}
	config_text := fmt.Sprintf(`var config = {WEBSOCKET_URL: "%s", ROOT: "%s", COMMIT: "%s"};`, ws_url, util.Cfg.WebRoot, util.Commit)
	http.HandleFunc(util.Cfg.WebRoot+"js/config.js", func(w http.ResponseWriter, r *http.Request) {
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

	http.HandleFunc(util.Cfg.WebSocketEndpoint, func(w http.ResponseWriter, r *http.Request) {

		websocket, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println(err)
			return
		}

		log.Println("Websocket Connected!")
		listen(websocket)
	})

	//http.Handle(util.Cfg.WebRoot, http.StripPrefix(util.Cfg.WebRoot, http.FileServer(http.Dir("./web"))))

	log.Println("IROS is running on http://" + http_address + util.Cfg.WebRoot)
	err := http.ListenAndServe(http_address, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
