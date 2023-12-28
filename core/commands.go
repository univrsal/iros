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

	"git.vrsal.cc/alex/iros/core/elements"
)

func process_command(session *IrosSession, cmd_type string, data map[string]json.RawMessage, command map[string]json.RawMessage) {

	switch cmd_type {
	case "add":
		// add/update element to session state map
		var t string
		err := json.Unmarshal(data["type"], &t)

		if err != nil {
			return
		}

		session.load_element(t, command)
	case "update":
		var id string
		err := json.Unmarshal(data["id"], &id)
		if err != nil {
			return
		}
		session.State[id].Update(command)
	case "delete":
		var id string
		err := json.Unmarshal(data["id"], &id)

		if err != nil {
			return
		}

		delete(session.State, id)
	case "transform":
		var id string
		err := json.Unmarshal(data["id"], &id)

		if err != nil {
			return
		}

		var transform elements.ElementTransform

		err = json.Unmarshal(data["transform"], &transform)
		if err != nil {
			return
		}

		e := session.State[id]
		e.SetTransform(transform)
		session.State[id] = e
	}
}
