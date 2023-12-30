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

package elements

import "encoding/json"

type TextElement struct {
	ElementBase
	Font            string `json:"font"`
	Size            int    `json:"size"`
	Color           string `json:"color"`
	BackgroundColor string `json:"background_color"`
	Text            string `json:"text"`
}

func (e *TextElement) Update(data map[string]json.RawMessage) {
	json.Unmarshal(data["args"], &e)
}

func (e *TextElement) SetTransform(transform ElementTransform) {
	e.Transform = transform
}
