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

package elements

import "encoding/json"

type AudioElement struct {
	ElementBase
	Url          string  `json:"url"`
	Loop         bool    `json:"loop"`
	Volume       float32 `json:"volume"`
	PlaybackRate float32 `json:"playback_rate"`
	Paused       bool    `json:"paused"`
	CurrentTime  float32 `json:"current_time"`
}

func (e *AudioElement) Update(data map[string]json.RawMessage) {
	json.Unmarshal(data["args"], &e)
}
