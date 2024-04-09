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

package util

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"os"
	"runtime/debug"
)

type Config struct {
	WebRoot            string `json:"webroot"`
	ServerDomain       string `json:"server_domain"`
	WebSocketEndpoint  string `json:"websocket_endpoint"`
	UseWSS             bool   `json:"use_wss"`
	HTTPPort           int    `json:"http_port"`
	HTTPServerAddress  string `json:"http_server_address"`
	DebugMode          bool   `json:"debug_mode"`
	SessionsBackupFile string `json:"sessions_backup_file"`
	APIToken           string `json:"api_token"`
}

var (
	Cfg Config
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

func GenerateToken() string {
	byteSlice := make([]byte, 32) // Change the number to adjust the length of the token
	_, err := rand.Read(byteSlice)
	if err != nil {
		panic(err) // Handle this error appropriately in your code
	}
	return hex.EncodeToString(byteSlice)
}

func LoadConfig(path string) {
	// Default config
	Cfg = Config{
		WebRoot:            "/",
		ServerDomain:       "localhost",
		WebSocketEndpoint:  "/ws",
		UseWSS:             true,
		HTTPPort:           8080,
		HTTPServerAddress:  "localhost",
		DebugMode:          false,
		SessionsBackupFile: "./sessions.json",
		APIToken:           GenerateToken(),
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

		dec := json.NewDecoder(f)
		err = dec.Decode(&Cfg)
		if err != nil {
			log.Fatal(err)
		}

		defer f.Close()

		outf, err := os.Create(path)
		if err != nil {
			log.Fatal(err)
		}
		defer outf.Close()
		// write the config back to the file to write any new fields that
		// the old config file didn't have
		enc := json.NewEncoder(outf)
		enc.SetIndent("", "  ")
		err = enc.Encode(Cfg)
		if err != nil {
			log.Fatal(err)
		}
	}
}
