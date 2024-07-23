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

function keybind_copy(edit, _e) {
    if (edit.selected_element)
        edit.internal_clipboard = edit.selected_element;
}

var warning_show_count = get_cookie("warning_show_count") || 0;

function check_dc(data) {
    if (data.indexOf("cdn.discordapp.com") !== -1 && warning_show_count < 2) {
        alert(`Discord CDN links are temporary. Any linked media will fail to load after the link expires. Consider uploading the media to a more permanent host. This warning will be only twice.`);
        warning_show_count++;
        set_cookie("warning_show_count", warning_show_count, 365);
    }
}

function keybind_paste(edit, _e) {
    read_data_from_clipboard().then(data => {
        let id = generate_element_id();
        if (data.indexOf("data:image") === 0) {
            let name = edit.make_unique_element_name("Image");
            edit.add_element(new image_element(edit, { url: data, id, name }));
        } else if (/(https?:\/\/.*\.(?:jpg|jpeg|gif|png|bmp|webp|svg|ico|avif|jxl))(?:\?.*)?$/i.test(data)) { // check if it's an image url
            check_dc(data);
            let name = edit.make_unique_element_name("Image");
            edit.add_element(new image_element(edit, { url: data, id, name }));
        } else if (/(https?:\/\/.*\.(?:mp3|wav|ogg|aac|flac|opus))(?:\?.*)?$/i.test(data)) { // check if it's an audio url
            check_dc(data);
            let name = edit.make_unique_element_name("Audio");
            edit.add_element(new audio_element(edit, { url: data, id, name, paused: true, transform: { width: 300, height: 50 } }));
        } else if (/(https?:\/\/.*\.(?:mp4|webm|mkv|avi))(?:\?.*)?$/i.test(data)) { // check if it's an video url
            check_dc(data);
            let name = edit.make_unique_element_name("Video");
            edit.add_element(new video_element(edit, { url: data, id, name, paused: true, transform: { width: 640, height: 360 } }));
        } else {
            let name = edit.make_unique_element_name("Text");
            edit.add_element(new text_element(edit, { text: data, id, size: 32, font: "Arial", color: "#000000", name }));
        }
    });
}

function keybind_paste_internal(edit, _e) {
    if (edit.internal_clipboard) {
        let new_element = edit.internal_clipboard.clone();
        new_element.tf().x += 10;
        new_element.tf().y += 10;
        new_element.data.name = edit.make_unique_element_name(new_element.data.name);
        edit.add_element(new_element);
    }
}

function keybind_duplicate_selected_element(edit, _e) {
    if (edit.selected_element) {
        let new_element = edit.selected_element.clone();
        new_element.tf().x += 10;
        new_element.tf().y += 10;
        new_element.data.name = edit.make_unique_element_name(new_element.data.name);
        edit.add_element(new_element);
    }
}

function keybind_delete_selected_element(edit, _e) {
    if (edit.selected_element && edit.current_mode === EDIT_MODE.NONE) {
        // remove from tickable elements
        let index = edit.tickable_elements.indexOf(edit.elements.get(edit.selected_element.id()));
        if (index > -1)
            edit.tickable_elements.splice(index, 1);

        // remove html
        edit.selected_element.html.remove();
        edit.elements.delete(edit.selected_element.id());
        send_command_delete_element(edit, edit.selected_element.id());
        edit.select_element(null);
        edit.rebuild_element_list();
    }
}

function keybind_toggle_overlay(edit, _e) {
    edit.overlay.classList.toggle("hide-overlay");
}

function keybind_mirror_selected_element(edit, e) {
    if (edit.selected_element) {
        if (e.shiftKey)
            edit.selected_element.flip_y();
        else
            edit.selected_element.flip_x();

        send_command_update_element(edit, edit.selected_element);
    }
}

function keybind_enter_scale_mode(edit, e) {
    if (edit.selected_element && edit.current_mode !== EDIT_MODE.SCALE) {
        edit.enter_mode(EDIT_MODE.SCALE, MODE_AXIS.XY);
        edit.initial_element_size = { x: edit.selected_element.tf().scale_x, y: edit.selected_element.tf().scale_y };
    }
}

function keybind_enter_move_mode(edit, _e) {
    if (edit.selected_element && edit.current_mode !== EDIT_MODE.MOVE) {
        edit.enter_mode(EDIT_MODE.MOVE, MODE_AXIS.XY);
        edit.initial_element_size = { x: edit.selected_element.tf().x, y: edit.selected_element.tf().y };
    }
}

function keybind_enter_rotate_mode(edit, _e) {
    if (edit.selected_element && edit.current_mode !== EDIT_MODE.ROTATE) {
        edit.enter_mode(EDIT_MODE.ROTATE, MODE_AXIS.Z);
        edit.initial_element_size = { rotation: edit.selected_element.tf().rotation_z };
    }
}

function keybind_exit_editor_modes(edit, _e) {
    if (edit.selected_element) {
        edit.leave_mode();
    }
}

function keybind_switch_axis_x(edit, _e) {
    if (edit.mode_axis !== MODE_AXIS.NONE) {
        edit.mode_axis = MODE_AXIS.X;
    }
}

function keybind_switch_axis_y(edit, _e) {
    if (edit.mode_axis !== MODE_AXIS.NONE) {
        edit.mode_axis = MODE_AXIS.Y;
    }
}

function keybind_switch_axis_z(edit, _e) {
    if (edit.mode_axis !== MODE_AXIS.NONE) {
        edit.mode_axis = MODE_AXIS.Z;
    }
}

function keybind_switch_axis_xy(edit, _e) {
    if (edit.mode_axis !== MODE_AXIS.NONE) {
        edit.mode_axis = MODE_AXIS.XY;
    }
}

function keybind_reset_transform(edit, _e) {
    if (edit.selected_element) {
        edit.selected_element.reset_transform();
        edit.update_selected_element();
        send_command_update_element(edit, edit.selected_element);
        // block this event otherwise it'll reload the page
        _e.preventDefault();
    }
}

function keybind_favorite_selected_element(edit, _e) {
    favorite_selected_element();
}

function keybind_toggle_selected_element_visibility(edit, _e) {
    if (edit.selected_element) {
        edit.selected_element.tf().visible = !edit.selected_element.tf().visible;
        edit.selected_element.update();
        edit.update_selected_element();
        send_command_update_element(edit, edit.selected_element);
    }
}

function keybind_reset_zoom(edit, _e) {
    edit.editor_zoom = 1;
    edit.editor_offset = [0, 0];
    edit.update_zoom_and_offset();
}

const editor_keybinds = [
    { code: "KeyC", ctrl: true, function: keybind_copy },
    { code: "KeyC", shift: true, function: keybind_copy },
    { code: "KeyV", ctrl: true, function: keybind_paste },
    { code: "KeyV", shift: true, function: keybind_paste_internal },
    { code: "Delete", ctrl: false, function: keybind_delete_selected_element },
    { code: "KeyX", ctrl: false, function: keybind_delete_selected_element },
    { code: "KeyE", ctrl: true, function: keybind_toggle_overlay },
    { code: "KeyM", ctrl: false, function: keybind_mirror_selected_element },
    { code: "KeyM", shift: true, function: keybind_mirror_selected_element },
    { code: "KeyS", ctrl: false, function: keybind_enter_scale_mode },
    { code: "KeyG", ctrl: false, function: keybind_enter_move_mode },
    { code: "KeyR", ctrl: false, function: keybind_enter_rotate_mode },
    { code: "Escape", ctrl: false, function: keybind_exit_editor_modes },
    { code: "KeyX", ctrl: false, function: keybind_switch_axis_x },
    { code: "KeyY", ctrl: false, function: keybind_switch_axis_y },
    { code: "KeyZ", ctrl: false, function: keybind_switch_axis_z },
    { code: "KeyZ", shift: true, function: keybind_switch_axis_xy },
    { code: "KeyR", ctrl: true, function: keybind_reset_transform },
    { code: "KeyF", ctrl: false, function: keybind_favorite_selected_element },
    { code: "KeyH", ctrl: false, function: keybind_toggle_selected_element_visibility },
    { code: "KeyD", shift: true, function: keybind_duplicate_selected_element },
    { code: "Space", ctrl: true, function: keybind_reset_zoom },
];
