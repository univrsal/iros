function keybind_copy(edit, _e) {
    if (edit.selected_element)
        edit.internal_clipboard = edit.selected_element;
}

function keybind_paste(edit, _e) {
    read_data_from_clipboard().then(data => {
        if (data.indexOf("data:image") === 0) {
            edit.add_element(new image_element(edit, { url: data }));
        } else if (/https?:\/\/.*\.(jpg|png|gif|jpeg|apng|webp|jxl|bmp)/gi.test(data)) { // check if it's an image url
            edit.add_element(new image_element(edit, { url: data }));
        } else {
            edit.add_element(new text_element(edit, { text: data, size: 32, font: "Arial", color: "#000000" }));
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
];
