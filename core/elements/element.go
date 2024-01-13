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

import (
	"encoding/json"
)

type Point struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
}

type Rotation struct {
	X float32 `json:"x"`
	Y float32 `json:"y"`
	Z float32 `json:"z"`
}

type ElementTransform struct {
	X         int     `json:"x"`
	Y         int     `json:"y"`
	Width     int     `json:"width"`
	Height    int     `json:"height"`
	RotationX float32 `json:"rotation_x"`
	RotationY float32 `json:"rotation_y"`
	RotationZ float32 `json:"rotation_z"`
	ScaleX    float32 `json:"scale_x"`
	ScaleY    float32 `json:"scale_y"`
	FlipX     bool    `json:"flip_x"`
	FlipY     bool    `json:"flip_y"`
	ZIndex    int     `json:"z_index"`
	Opacity   float32 `json:"opacity"`
	Visible   bool    `json:"visible"`
	HPivot    string  `json:"h_pivot"`
	VPivot    string  `json:"v_pivot"`
}

type Element interface {
	Update(data map[string]json.RawMessage)
	SetTransform(transform ElementTransform)
	SetPosition(position Point)
	SetScale(scale Point)
	SetRotation(rotation Rotation)
}

type ElementBase struct {
	Id        string           `json:"id"`
	Name      string           `json:"name"`
	Type      string           `json:"type"`
	Transform ElementTransform `json:"transform"`
}

func (e *ElementBase) Update(data map[string]json.RawMessage) {
	json.Unmarshal(data["args"], &e)
}

func (e *ElementBase) SetTransform(transform ElementTransform) {
	e.Transform = transform
}

func (e *ElementBase) SetPosition(position Point) {
	e.Transform.X = int(position.X)
	e.Transform.Y = int(position.Y)
}

func (e *ElementBase) SetScale(scale Point) {
	e.Transform.ScaleX = scale.X
	e.Transform.ScaleY = scale.Y
}

func (e *ElementBase) SetRotation(rotation Rotation) {
	e.Transform.RotationX = rotation.X
	e.Transform.RotationY = rotation.Y
	e.Transform.RotationZ = rotation.Z
}
