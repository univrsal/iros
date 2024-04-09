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

	"git.vrsal.cc/alex/iros/core/elements"
)

func try_unmarshal(id *string, id_data []byte, data []byte, data_out any) error {
	err := json.Unmarshal(id_data, &id)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, data_out)
	if err != nil {
		return err
	}

	return nil
}

func process_command(session *IrosSession, cmd_type string, data map[string]json.RawMessage, command map[string]json.RawMessage) {

	switch cmd_type {
	case "add":
		// add/update element to session state map
		var t string
		err := json.Unmarshal(data["type"], &t)

		if err != nil {
			return
		}

		session.load_element(t, command["args"])
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
		var transform elements.ElementTransform
		if err := try_unmarshal(&id, data["id"], data["transform"], &transform); err == nil {
			session.State[id].SetTransform(transform)
		}
	case "move": // move element
		var id string
		var pos elements.Point

		if err := try_unmarshal(&id, data["id"], data["pos"], &pos); err == nil {
			session.State[id].SetPosition(pos)
		}

	case "scale": // scale element
		var id string
		var scale elements.Point
		if err := try_unmarshal(&id, data["id"], data["scale"], &scale); err == nil {
			session.State[id].SetScale(scale)
		}
	case "rotate": // rotate element
		var id string
		var rotation elements.Rotation
		if err := try_unmarshal(&id, data["id"], data["rotation"], &rotation); err == nil {
			session.State[id].SetRotation(rotation)
		}
	default:
		// some commands are only for client to client communication and have no effect on the server
		return
	}
}
