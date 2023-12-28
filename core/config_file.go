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
	"os"
)

type Config struct {
	WebRoot           string `json:"webroot"`
	ServerDomain      string `json:"server_domain"`
	WebSocketEndpoint string `json:"websocket_endpoint"`
	UseWSS            bool   `json:"use_wss"`
	HTTPPort          int    `json:"http_port"`
	HTTPServerAddress string `json:"http_server_address"`
}

var (
	Cfg Config
)

func LoadConfig(path string) {
	// Default config
	Cfg = Config{
		WebRoot:           "/",
		ServerDomain:      "localhost",
		WebSocketEndpoint: "/ws",
		UseWSS:            true,
		HTTPPort:          8080,
		HTTPServerAddress: "localhost",
	}

	// check if cmd.CfgFilePath is empty
	if path == "" {
		// use $cwd/config.json
		path = "./config.json"
	}

	// check if config file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// create it and write the defaults to it
		f, err := os.Create(path)
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		enc := json.NewEncoder(f)
		enc.SetIndent("", "  ")
		err = enc.Encode(Cfg)
		if err != nil {
			log.Fatal(err)
		}
	} else {
		// load it and overwrite the defaults
		f, err := os.Open(path)
		if err != nil {
			log.Fatal(err)
		}
		defer f.Close()

		dec := json.NewDecoder(f)
		err = dec.Decode(&Cfg)
		if err != nil {
			log.Fatal(err)
		}
	}
}
