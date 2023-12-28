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

class viewer {
    constructor(container) {
        this.container = container;
        this.elements = new Map();
        this.tickable_elements = [];
        this.commands = get_commands();
        this.connected = false;

        this.socket = new WebSocket(config.WEBSOCKET_URL);
        this.socket.onopen = e => this.on_open(e);
        this.socket.onmessage = e => this.on_data(e);
        this.socket.onclose = e => this.on_close(e);
        this.socket.onerror = err => this.on_error(err);

        $(window).on("resize", () => this.on_resize());
        this.on_resize();

        // get session id from url
        let url = new URL(window.location.href);
        this.session_id = url.searchParams.get("session");

        // remove session id from url so it's not visible in browser
        url.searchParams.delete("session");
        window.history.replaceState({}, document.title, url.href);

        // check if session id is valid
        if (!this.session_id) {
            if (this.is_editor()) {
                // check local storage for session id
                this.session_id = localStorage.getItem("session");
            }
            if (!this.session_id) {
                alert("No session id provided!");
                return;
            }
        } else if (this.is_editor()) {
            // save session id to local storage, so reloading the page without the session id in the url works
            localStorage.setItem("session", this.session_id);
        }

        setInterval(() => this.tick(), 1000 / 60);

    }

    get_canvas_width() { return this.container.clientWidth; }
    get_canvas_height() { return this.container.clientHeight; }

    on_resize() {
        this.container.width = window.innerWidth;
        this.container.height = window.innerHeight;
    }

    tick() {
        this.tickable_elements.forEach(element => element.tick());
    }

    on_error(e) {
        console.log(e);
        this.connected = false;
    }

    on_close(e) {
        // reconnect
        this.connected = false;
        setTimeout(() => {
            this.socket = new WebSocket(config.WEBSOCKET_URL);
            this.socket.onopen = e => this.on_open(e);
            this.socket.onmessage = e => this.on_data(e);
            this.socket.onclose = e => this.on_close(e);
            this.socket.onerror = err => this.on_error(err);
        }, 1000);
    }

    on_open(e) {
        this.connected = true;
        this.socket.send(JSON.stringify({ session: this.session_id }));
    }

    on_data(e) {
        let data = JSON.parse(e.data);
        if (data.type === undefined) {
            // iterate over elements in data object
            for (const [_, args] of Object.entries(data)) {
                command_add_element(this, args);
            }

        } else {
            this.parse_and_run_command(data, this);
        }
    }

    parse_and_run_command(command) {
        if (this.commands.has(command.type))
            this.commands.get(command.type)(this, command.args);
    }

    send(obj) {
        if (this.connected)
            this.socket.send(JSON.stringify(obj));
    }

    is_editor() { return false; }
}