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