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

class text_element extends element {
    constructor(parent, data, type = "text") {
        super(parent, type, data);
        this.html = $(`<div class="iros-element iros-text-element" id="${this.data.id}">${this.get_formatted_text()}</div>`);
    }

    update() {
        if (this.tf().visible)
            this.html.classList.remove("hidden");
        else
            this.html.classList.add("hidden");
        this.html.style.zIndex = this.tf().z_index;
        this.html.style.opacity = this.tf().opacity;
        this.html.style.transform = this.build_transform();
        this.html.style.fontFamily = this.data.font;
        this.html.style.fontSize = this.data.size + "px";
        this.html.style.color = this.data.color;
        this.html.style.backgroundColor = this.data.background_color;
        this.html.innerHTML = this.get_formatted_text();
        this.data.transform.width = this.html.clientWidth;
        this.data.transform.height = this.html.clientHeight;
        this.html.style.transformOrigin = `${this.tf().h_pivot} ${this.tf().v_pivot}`;
    }

    get_formatted_text() {
        let text = this.data.text.replace(/\n/g, "<br>");

        // replace **bold** with <b>bold</b>
        text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");

        // replace *italic* with <i>italic</i>
        text = text.replace(/\*(.*?)\*/g, "<i>$1</i>");

        // replace ~~strikethrough~~ with <s>strikethrough</s>
        text = text.replace(/~~(.*?)~~/g, "<s>$1</s>");

        // replace __underline__ with <u>underline</u>
        text = text.replace(/__(.*?)__/g, "<u>$1</u>");

        return text;
    }
}

class text_element_handler extends element_handler {
    constructor(edt, type = "text") {
        super(edt, type);
        this.color_settings = $("#color-settings");
        this.text_settings = $("#text-settings");
        this.background_color_settings = $("#background-color-settings");
        this.color = $("#color");
        this.background_color = $("#background-color");
        this.enable_background_color = $("#enable-background-color");
        this.text = $("#text");
        this.font = $("#font");
        this.size = $("#font-size");
        this.selected_element = null;

        this.color.on("input", () => this.update_selected_element());
        this.background_color.on("input", () => this.update_selected_element());
        this.enable_background_color.on("input", () => this.update_selected_element());
        this.text.on("input", () => this.update_selected_element());
        this.font.on("input", () => this.update_selected_element());
        this.size.on("input", () => this.update_selected_element_and_ui());
    }

    update_selected_element_and_ui() {
        this.update_selected_element();
        this.edt.update_selected_element();
    }

    update_selected_element() {
        if (this.selected_element) {
            this.selected_element.data.color = this.color.value;
            this.selected_element.data.background_color = this.background_color.value + (this.enable_background_color.checked ? "ff" : "00");
            this.selected_element.data.text = this.text.value;
            this.selected_element.data.font = this.font.value;
            this.selected_element.data.size = Number(this.size.value);
            send_command_update_element(this.edt, this.selected_element);
            this.selected_element.update();
        }
    }

    show_settings(element) {
        this.color_settings.style.display = "grid";
        this.text_settings.style.display = "grid";
        this.background_color_settings.style.display = "grid";
        this.color.value = element.data.color;
        this.background_color.value = element.data.background_color.substring(0, 7);
        this.enable_background_color.checked = element.data.background_color.substring(7) === "ff";
        this.text.value = element.data.text;
        this.font.value = element.data.font;
        this.size.value = element.data.size;
        this.selected_element = element;
    }

    hide_settings() {
        this.color_settings.style.display = "none";
        this.text_settings.style.display = "none";
        this.background_color_settings.style.display = "none";
        this.selected_element = null;
    }
}

function add_text_element() {
    let data = {
        text: "Hello World!",
        font: "serif",
        size: 32,
        color: "#ff0000",
        background_color: "#00000000",
        name: `Text ${edt.get_next_element_id()}`,
    };
    edt.add_element(create_element(edt, "text", data));
}