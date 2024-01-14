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

class element {
    constructor(parent, type, data) {
        this.data = {
            id: undefined,
            transform: {
                x: 0, y: 0, width: 0, height: 0,
                rotation_x: 0, rotation_y: 0, rotation_z: 0,
                flip_x: false, flip_y: false, scale_x: 1, scale_y: 1,
                z_index: 0, opacity: 1, visible: false, h_pivot: 'center', v_pivot: 'center'
            }
        };
        this.parent = parent;

        for (let key in data)
            if (key !== "transform")
                this.data[key] = data[key];
        for (let key in data.transform)
            this.data.transform[key] = data.transform[key];

        this.data.type = type;
        if (data.id == undefined)
            this.data.id = Math.random().toString(36).substring(7);
        this.html = null;
    }

    shuffle_id() {
        this.data.id = Math.random().toString(36).substring(7);
        if (this.html != null)
            this.html.id = this.data.id;
    }

    delete() {
        if (this.html != null) {
            this.html.remove();
            this.html = null;
        }
    }

    id() { return this.data.id; }
    type() { return this.data.type; }

    clone() {
        // create deep copy of data
        let data = JSON.parse(JSON.stringify(this.data));
        let result = create_element(this.parent, data.type, data);
        result.shuffle_id();
        return result;
    }

    tf() { return this.data.transform; }

    reset_transform() {
        this.tf().rotation_x = 0;
        this.tf().rotation_y = 0;
        this.tf().rotation_z = 0;
        this.tf().flip_x = false;
        this.tf().flip_y = false;
        this.tf().scale_x = 1;
        this.tf().scale_y = 1;
        this.tf().h_pivot = 'center';
        this.tf().v_pivot = 'center';
        this.update();
    }

    update() {
        if (this.html != null) {
            this.html.style.transform = this.build_transform();
            if (this.tf().width > 0 && this.tf().height > 0) {
                this.html.style.width = this.tf().width + "px";
                this.html.style.height = this.tf().height + "px";
            }
            this.html.style.zIndex = this.tf().z_index;
            this.html.style.opacity = this.tf().opacity;
            this.html.style.transformOrigin = `${this.tf().h_pivot} ${this.tf().v_pivot}`;
            if (this.tf().visible)
                this.html.classList.remove("hidden");
            else
                this.html.classList.add("hidden");
        }

        // make sure width and height are positive
        if (this.tf().width < 0) {
            this.tf().width = Math.abs(this.tf().width);
            this.tf().x -= this.tf().width;
        }
        if (this.tf().height < 0) {
            this.tf().height = Math.abs(this.tf().height);
            this.tf().y -= this.tf().height;
        }
    }

    set_layer(layer) {
        this.tf().z_index = layer;
        this.update();
    }

    flip_x() {
        this.tf().flip_x = !this.tf().flip_x;
        this.update();
    }

    flip_y() {
        this.tf().flip_y = !this.tf().flip_y;
        this.update();
    }

    build_transform() {
        let result = "";
        result += `translate(${this.tf().x}px, ${this.tf().y}px)`;
        result += ` scale(${this.tf().scale_x}, ${this.tf().scale_y})`;
        result += ` rotateX(${this.tf().rotation_x}deg) rotateY(${this.tf().rotation_y}deg) rotateZ(${this.tf().rotation_z}deg) `;
        if (this.tf().flip_x)
            result += "scaleX(-1) ";
        if (this.tf().flip_y)
            result += "scaleY(-1) ";

        return result;
    }

    is_resizable() { return false; }

    tickable() { return false; }
    tick() { }
}

class element_handler {
    constructor(edt, type) {
        this.edt = edt;
        this.type = type;
    }
    update_selected_element() { }
}

var element_types = null;
var element_handlers = [];
$(document).ready(() => {
    element_types = {
        "image": image_element,
        "text": text_element,
        "timer": timer_element,
        "audio": audio_element,
    };
    element_handlers = [
        new image_element_handler(edt),
        new text_element_handler(edt),
        new timer_element_handler(edt),
        new audio_element_handler(edt),
    ];
});

function create_element(parent, type, data) {
    // check if type is valid
    if (element_types[type] == undefined)
        return null;
    return new element_types[type](parent, data);
}