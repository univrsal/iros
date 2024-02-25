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

var moving_window = null;
var move_offset = [];

$(document).ready(() => {
    ["#settings", "#element-list"].forEach((id) => {
        $(`${id}-header`).on("mousedown", (e) => {
            moving_window = $(`${id}-window`);
            move_offset = [e.clientX - moving_window.offsetLeft, e.clientY - moving_window.offsetTop];
        });
    });
    $(document).on("mouseup", () => {
        moving_window = null;
        save_settings();
    });
    $(document).on("mousemove", (e) => {
        if (moving_window) {
            moving_window.style.left = (e.clientX - 10 - move_offset[0]) + "px";
            moving_window.style.top = (e.clientY - 10 - move_offset[1]) + "px";
        }
    });
});

var settings = {};
function load_settings() {
    let settings = localStorage.getItem('settings');
    // try to load settings from url first
    // try to load the embed url and canvas size from the url

    let url = new URL(window.location.href);
    let embed_url = url.searchParams.get("url");
    let canvas_width = url.searchParams.get("w");
    let canvas_height = url.searchParams.get("h");
    if (embed_url) {
        $(`#embed-url`).value = embed_url;
        embed_player();
    }
    if (canvas_width)
        $(`#canvas-width`).value = canvas_width;
    if (canvas_height)
        $(`#canvas-height`).value = canvas_height;
    if (settings) {
        settings = JSON.parse(settings);
        // apply settings
        $(`#settings-window`).style.left = settings.settings_x_pos;
        $(`#settings-window`).style.top = settings.settings_y_pos;
        $(`#element-list-window`).style.left = settings.element_list_x_pos;
        $(`#element-list-window`).style.top = settings.element_list_y_pos;
        if (!canvas_width)
            $(`#canvas-width`).value = settings.canvas_width;
        if (!canvas_height)
            $(`#canvas-height`).value = settings.canvas_height;
        if (!embed_url) {
            $(`#embed-url`).value = settings.stream_url;
            embed_player();
        }
    }
}

function save_settings() {
    settings.settings_x_pos = $(`#settings-window`).style.left;
    settings.settings_y_pos = $(`#settings-window`).style.top;
    settings.element_list_x_pos = $(`#element-list-window`).style.left;
    settings.element_list_y_pos = $(`#element-list-window`).style.top;
    settings.canvas_width = $(`#canvas-width`).value;
    settings.canvas_height = $(`#canvas-height`).value;
    settings.stream_url = $(`#embed-url`).value;
    localStorage.setItem('settings', JSON.stringify(settings));
}