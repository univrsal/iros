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

class audio_element extends element {
    constructor(parent, data, type = "audio") {
        super(parent, type, data);
        this.html = $(`<${type} controls class="iros-element" id="${this.data.id}" src="${this.data.url}"></${type}>`);
        this.is_remote_event = false;

        if (parent.is_editor()) {
            this.html.muted = true; // we don't want to hear the audio in the editor
            // react to pausing, volume change, seeking, etc.
            this.html.addEventListener("pause", () => {
                if (!this.is_remote_event) {
                    this.data.paused = true;
                    send_command_update_element(this.parent, this);
                }
            });

            this.html.addEventListener("play", () => {
                if (!this.is_remote_event) {
                    this.data.paused = false;
                    send_command_update_element(this.parent, this);
                }
            });

            this.html.addEventListener("volumechange", () => {
                if (!this.is_remote_event) {
                    this.data.volume = this.html.volume;
                    send_command_update_element(this.parent, this);
                }
            });

            this.html.addEventListener("ratechange", () => {
                if (!this.is_remote_event) {
                    this.data.playback_rate = this.html.playbackRate;
                    send_command_update_element(this.parent, this);
                }
            });

            this.html.addEventListener("seeking", () => {
                if (!this.is_remote_event) {
                    this.data.current_time = this.html.currentTime;
                    send_command_update_element(this.parent, this);
                }
            });
        }
    }

    set_url(url) {
        this.html.src = url;
        this.data.url = url;
    }

    tick() {
        if (!this.html.paused) {
            this.data.current_time = this.html.currentTime;
        }
    }

    tickable() { return true; }

    update() {
        this.is_remote_event = true; // prevent sending an update in response to this event
        super.update();
        if (this.html.src.indexOf(this.data.url) == -1) {
            this.html.src = this.data.url;
        }

        // update volume, playback rate, etc.
        if (Math.abs(this.html.volume - this.data.volume) > 0.01)
            this.html.volume = this.data.volume;
        if (Math.abs(this.html.playbackRate - this.data.playback_rate) > 0.01)
            this.html.playbackRate = this.data.playback_rate;
        if (this.html.loop != this.data.loop)
            this.html.loop = this.data.loop;
        if (Math.abs(this.html.currentTime - this.data.current_time) > 1)
            this.html.currentTime = this.data.current_time;
        if (this.data.paused != this.html.paused) {
            if (this.data.paused)
                this.html.pause();
            else
                this.html.play();
        }
        this.is_remote_event = false;
    }

    is_resizable() { return true; }
}

class audio_element_handler extends element_handler {
    constructor(edt, type = "audio") {
        super(edt, type);
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

function add_audio_element(url = null, name = null, width = 300, height = 50) {
    if (url === null)
        url = "";
    if (name === null)
        name = `Audio ${edt.get_next_element_id()}`;
    let data = {
        url,
        transform: {
            x: 0,
            y: 0,
            width,
            height,
        },
        name,
        loop: false,
        volume: 0.5,
        playback_rate: 1,
        paused: true,
        current_time: 0,
    };
    edt.add_element(create_element(edt, "audio", data));
}