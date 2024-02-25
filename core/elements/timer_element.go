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

type TimerElement struct {
	TextElement
	Countdown      bool `json:"countdown"`
	Active         bool `json:"active"`
	StartTimestamp int  `json:"start_time"`
	CountdownMS    int  `json:"countdown_ms"`
	BaseTimeMS     int  `json:"base_time_ms"`
}

func (e *TimerElement) Update(data map[string]json.RawMessage) {
	json.Unmarshal(data["args"], &e)
}
