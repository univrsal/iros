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
        this.ignore_event = false;
        if (parent.is_editor()) {
            this.html.muted = true; // we don't want to hear the audio in the editor
            // react to pausing, volume change, seeking, etc.
            $(this.html).on("pause", () => {
                if (!this.ignore_event && this.parent.selected_element != this) {
                    this.ignore_event = true;
                    this.html.play();
                    this.ignore_event = false;
                    edt.on_element_clicked(null, this);
                    return;
                }
                if (!this.is_remote_event) {
                    this.data.paused = true;
                    send_command_update_element(this.parent, this);
                }
            });

            $(this.html).on("play", () => {
                if (!this.ignore_event && this.parent.selected_element != this) {
                    this.ignore_event = true;
                    this.html.pause();
                    this.ignore_event = false;
                    edt.on_element_clicked(null, this);
                    return;
                }
                if (!this.is_remote_event) {
                    this.data.paused = false;
                    send_command_update_element(this.parent, this);
                }
            });

            $(this.html).on("volumechange", () => {
                if (!this.is_remote_event) {
                    this.data.volume = this.html.volume;
                    send_command_update_element(this.parent, this);
                }
            });

            $(this.html).on("ratechange", () => {
                if (!this.is_remote_event) {
                    this.data.playback_rate = this.html.playbackRate;
                    send_command_update_element(this.parent, this);
                }
            });

            $(this.html).on("seeking", (event) => {
                if (this.parent.selected_element != this) {
                    event.preventDefault();
                    return;
                }
                if (!this.is_remote_event) {
                    this.data.current_time = this.html.currentTime;
                    send_command_update_element(this.parent, this);
                }
            });

            $(this.html).on("click", event => {
                // if the user clicks on the video and it is not the current element, prevent the click
                if (this.parent.selected_element != this) {
                    event.preventDefault();
                }
            });
        }
    }

    set_url(url) {
        if (url == this.data.url)
            return;

        // validate url by turning it into a URL object
        try {
            let _tmp = new URL(url);
        } catch (e) {
            console.log("Invalid URL: ", url);
            return;
        }

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


        this.html.style.width = `${this.data.transform.width}px`;
        this.html.style.height = `${this.data.transform.height}px`;

        // update volume, playback rate, etc.
        if (Math.abs(this.html.volume - this.data.volume) > 0.01)
            this.html.volume = this.data.volume;
        if (Math.abs(this.html.playbackRate - this.data.playback_rate) > 0.01)
            this.html.playbackRate = this.data.playback_rate;
        if (this.html.loop != this.data.loop)
            this.html.loop = this.data.loop;
        if (Math.abs(this.html.currentTime - this.data.current_time) > 1)
            this.html.currentTime = this.data.current_time;

        if (this.html.src.indexOf(this.data.url) == -1) {
            this.html.src = this.data.url;
            this.data.current_time = 0;
        }

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
        this.volume_settings = $("#volume-settings");
        this.url = $("#url-input");
        this.volume = $("#volume-input");
        this.selected_element = null;
        this.url.on("input", () => this.update_selected_element());
        this.volume.on("input", () => this.update_selected_element());
    }

    update_selected_element() {
        if (this.selected_element) {
            this.selected_element.set_url(this.url.value);
            this.selected_element.data.volume = this.volume.value / 100.0;
            send_command_update_element(this.edt, this.selected_element);
        }
    }

    show_settings(element) {
        this.url_settings.style.display = "grid";
        this.volume_settings.style.display = "grid";
        this.url.value = element.data.url;
        this.volume.value = element.data.volume * 100.0;
        this.selected_element = element;
    }

    hide_settings() {
        this.url_settings.style.display = "none";
        this.volume_settings.style.display = "none";
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