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
	"encoding/json"
	"log"
	"net/http"
	"time"

	"git.vrsal.cc/alex/iros/core/util"
	"git.vrsal.cc/alex/iros/core/wss"
)

func PurgeSessions(w http.ResponseWriter, r *http.Request) {
	authToken := r.Header.Get("Authorization")
	if authToken != util.Cfg.APIToken {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var amount int = 0
	for id, session := range wss.Instance.Sessions {
		if time.Now().Unix()-session.LastConnectionTime > 60*60*24*7 {
			// delete session
			delete(wss.Instance.Sessions, id)
			amount++
		}
	}
	log.Println("Purged", amount, "sessions")

	w.WriteHeader(http.StatusOK)
}

func PurgeEmptySessions(w http.ResponseWriter, r *http.Request) {
	authToken := r.Header.Get("Authorization")
	if authToken != util.Cfg.APIToken {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var amount int = 0
	for id, session := range wss.Instance.Sessions {
		if len(session.State) == 0 {
			// delete session
			delete(wss.Instance.Sessions, id)
			amount++
		}
	}
	log.Println("Purged", amount, "sessions")

	w.WriteHeader(http.StatusOK)
}

func GetListOfNonEmptySessions(w http.ResponseWriter, r *http.Request) {
	authToken := r.Header.Get("Authorization")
	if authToken != util.Cfg.APIToken {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	type Response struct {
		Sessions []string `json:"sessions"`
	}

	var data Response

	for id, session := range wss.Instance.Sessions {
		if len(session.State) != 0 {
			data.Sessions = append(data.Sessions, id)
		}
	}

	// send json response
	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(data)

	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
	} else {
		w.WriteHeader(http.StatusOK)
	}
}
