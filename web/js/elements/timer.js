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

class timer_element extends text_element {
    constructor(parent, data) {
        super(parent, data, "timer");
    }

    update() {
        super.update();
    }

    tick() {
        if (this.data.active) {
            if (this.data.countdown) {
                let time = this.data.countdown_ms - (Date.now() - this.data.start_time);
                if (time < 0) {
                    this.data.active = false;
                    this.data.start_time = 0;
                }
                this.data.text = seconds_to_time(time / 1000);
            } else {
                let time = this.data.base_time_ms + Date.now() - this.data.start_time;
                this.data.text = seconds_to_time(time / 1000);
            }
            this.html.innerHTML = this.get_formatted_text();
        }
    }

    tickable() { return true; }
}


class timer_element_handler extends text_element_handler {
    constructor(edt) {
        super(edt, "timer");
        this.timer_settings = $("#timer-settings");
        this.countdown = $("#timer-type-timer");
        this.stopwatch = $("#timer-type-stopwatch");
        this.timer_time = $("#timer-time");

        this.countdown.on("input", () => this.update_selected_element());
        this.stopwatch.on("input", () => this.update_selected_element());
        this.timer_time.on("input", () => this.update_selected_element());
    }

    update_selected_element_and_ui() {
        this.update_selected_element();
        this.edt.update_selected_element();
    }

    update_selected_element() {
        if (this.selected_element) {
            this.selected_element.data.countdown = this.countdown.checked;
            this.selected_element.data.countdown_ms = parse_time_to_seconds(this.timer_time.value) * 1000;
        }
        super.update_selected_element();
    }

    show_settings(element) {
        super.show_settings(element);
        this.text.style.display = "none";
        this.timer_settings.style.display = "grid";
        this.countdown.checked = element.data.countdown;
        this.stopwatch.checked = !element.data.countdown;
        this.timer_time.value = seconds_to_time(element.data.countdown_ms / 1000);
    }

    hide_settings() {
        super.hide_settings();
        this.text.style.display = "block";
        this.timer_settings.style.display = "none";
        this.selected_element = null;
    }
}

function start_timer() {
    if (edt.selected_element) {
        edt.selected_element.data.active = true;
        if (edt.selected_element.data.start_time === 0) {
            edt.selected_element.data.start_time = Date.now();
        } else {
            edt.selected_element.data.start_time = Date.now();
        }

        // send update command
        send_command_update_element(edt, edt.selected_element);
    }
}

function pause_timer() {
    if (edt.selected_element && edt.selected_element.data.active) {
        edt.selected_element.data.active = false;
        edt.selected_element.data.base_time_ms += Date.now() - edt.selected_element.data.start_time;
        // send update command
        send_command_update_element(edt, edt.selected_element);
    }
}

function reset_timer() {
    if (edt.selected_element) {
        edt.selected_element.data.start_time = 0;
        edt.selected_element.data.base_time_ms = 0;
        if (edt.selected_element.data.countdown) {
            edt.selected_element.data.text = seconds_to_time(edt.selected_element.data.countdown_ms / 1000);
        } else {
            edt.selected_element.data.text = seconds_to_time(0);
        }

        edt.selected_element.data.active = false;

        // send update command
        send_command_update_element(edt, edt.selected_element);
        edt.selected_element.update();
    }
}

function add_timer_element() {
    let data = {
        text: seconds_to_time(0),
        font: "serif",
        active: false,
        countdown: false,
        start_time: 0,
        base_time_ms: 0,
        countdown_ms: 0,
        size: 32,
        background_color: "#00000000",
        color: "#ff0000",
        name: `Timer ${edt.get_next_element_id()}`,
    };
    edt.add_element(create_element(edt, "timer", data));
}