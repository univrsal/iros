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

class iframe_element extends element {
    constructor(parent, data) {
        super(parent, "iframe", data);
        this.html = $(`<div class="iros-element"  id="${this.data.id}"></div>`);
        this.blocker = $(`<div class="iros-iframe-blocker"></div>`);
        this.iframe = $(`<iframe class="iros-iframe" src="${this.data.url}" frameborder="0"></iframe>`);
        this.html.append(this.blocker);
        this.html.append(this.iframe);
        this.block_events = data.block_events;

        if (parent.is_editor()) {
            $(this.html).on("load", (event) => {
                console.log(event);
            });
        }
    }

    set_url(url) {
        if (this.iframe.src == url)
            return false;

        // validate url by turning it into a URL object
        try {
            let _tmp = new URL(url);
        } catch (e) {
            console.log("Invalid URL: ", url);
            return false;
        }

        this.iframe.src = url;
        this.data.url = url;
        return true;
    }

    set_block_events(block_events) {
        this.data.block_events = block_events;
        this.blocker.style.display = this.data.block_events ? "block" : "none";
        return true;
    }

    update() {
        super.update();
        this.set_url(this.data.url);
        this.set_block_events(this.data.block_events);
        this.html.style.width = `${this.data.transform.width}px`;
        this.html.style.height = `${this.data.transform.height}px`;
    }

    is_resizable() { return true; }
}

class iframe_element_handler extends element_handler {
    constructor(edt) {
        super(edt, "iframe");
        this.url = $("#url-input");
        this.block_events = $("#block-events");
        this.url_settings = $("#url-settings");
        this.event_settings = $("#event-settings");
        this.block_events.on("change", () => this.update_selected_element());
        this.url.on("input", () => this.update_selected_element());
    }

    update_selected_element() {
        if (this.selected_element) {
            let changed = false;
            changed |= this.selected_element.set_url(this.url.value);
            changed |= this.selected_element.set_block_events(this.block_events.checked);
            if (changed)
                send_command_update_element(this.edt, this.selected_element);
        }
    }

    show_settings(element) {
        this.url_settings.style.display = "grid";
        this.event_settings.style.display = "grid";
        this.url.value = element.data.url;
        this.selected_element = element;
        this.block_events.checked = element.data.block_events;
    }

    hide_settings() {
        this.url_settings.style.display = "none";
        this.event_settings.style.display = "none";
        this.selected_element = null;
    }
}

function add_iframe_element(url = null, name = null, width = 480, height = 360) {
    if (url === null)
        url = "https://example.com";
    if (name === null)
        name = `Iframe ${edt.get_next_element_id()}`;
    let data = {
        url,
        block_events: true,
        transform: {
            x: 0,
            y: 0,
            width,
            height,
        },
        name
    };
    edt.add_element(create_element(edt, "iframe", data));
}