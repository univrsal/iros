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

class image_element extends element {
    constructor(parent, data) {
        super(parent, "image", data);
        this.html = $(`<img draggable="false" class="iros-element" id="${data.id}" src="${this.data.url}"></img>`);
        // update size after image is loaded
        this.html.onload = () => {
            this.tf().width = Math.max(this.html.width, 100);
            this.tf().height = Math.max(this.html.height, 100);
            if (this.parent.is_editor())
                this.parent.update_selected_element();
        };
    }

    set_url(url) {
        this.html.src = url;
        this.data.url = url;
    }

    update() {
        super.update();
        if (this.html.src.indexOf(this.data.url) == -1) {
            this.html.src = this.data.url;
        }
    }

    is_resizable() { return true; }
}

class image_element_handler extends element_handler {
    constructor(edt) {
        super(edt, "image");
        this.url_settings = $("#url-settings");
        this.url = $("#url-input");
        this.selected_element = null;
        this.url.on("input", () => this.update_selected_element());
    }

    update_selected_element() {
        if (this.selected_element) {
            this.selected_element.set_url(this.url.value);
            send_command_update_element(this.edt, this.selected_element);
        }
    }

    show_settings(element) {
        this.url_settings.style.display = "grid";
        this.url.value = element.data.url;
        this.selected_element = element;
    }

    hide_settings() {
        this.url_settings.style.display = "none";
        this.selected_element = null;
    }
}

function add_image_element() {
    let data = {
        url: `${document.location.origin}${config.ROOT}img/empty.png`,
        transform: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        },
        name: `Image ${edt.get_next_element_id()}`,
    };
    edt.add_element(create_element(edt, "image", data));
}