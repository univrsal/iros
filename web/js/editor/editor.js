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

var windows = [];

$(document).ready(() => {
    windows = document.getElementsByClassName("window");
});

class editor extends viewer {
    constructor(container) {
        super(container);
        this.player_container = $("#player-container");
        this.main_container = $("#main-container");
        this.in_landscape_mode = false;
        this.internal_clipboard = null;
        this.selected_element = null;
        this.dragging_element = false;
        this.current_mode = EDIT_MODE.NONE;
        this.mode_axis = MODE_AXIS.NONE;

        this.initial_position = { x: -1, ux: -1, lx: -1, y: -1, uy: -1, ly: -1 };
        this.initial_element_size = { width: 0, height: 0 };
        this.start_rotation_angle = 0;
        this.element_handlers = [new text_element_handler(this), new image_element_handler(this), new timer_element_handler(this)];

        this.pos_x = $("#pos-x");
        this.pos_y = $("#pos-y");
        this.width = $("#width");
        this.height = $("#height");
        this.z_index = $("#z-index");
        this.opacity = $("#opacity");
        this.visibility = $("#visibility");
        this.element_name = $("#element-name");
        this.element_list = $("#element-list-select");
        this.connection_indicator = $("#connection-indicator");
        this.canvas_width = $("#canvas-width");
        this.canvas_height = $("#canvas-height");
        this.editor_canvas = $("#editor-canvas");
        this.ctx = this.editor_canvas.getContext("2d");
        this.mouse_pos = [0, 0];
        this.last_move_event = null;
        this.element_count = 0;
        this.editor_zoom = 1;
        this.editor_offset = [0, 0];
        this.initial_editor_offset = [0, 0];
        this.space_pressed = false;

        let opts = document.getElementsByClassName("pivot-option");
        this.pivot_options = [];
        for (let i = 0; i < opts.length; i++) {
            this.pivot_options.push(opts[i]);
            $(opts[i]).on("click", () => { this.on_pivot_changed(opts[i]); });
        }

        $(document).on("mousemove", e => this.on_mouse_move(e));
        $(document).on("mouseup", e => this.on_mouse_up(e));
        $(document).on("mousedown", e => this.on_mouse_down(e));
        $(document).on("wheel", (e) => this.on_scroll(e));

        $(document).on("keydown", e => this.on_key_down(e));
        $(document).on("keyup", e => this.on_key_up(e));
        $(this.element_name).on("input", () => this.on_element_name_changed());
        $(this.canvas_width).on("change", () => this.on_resize());
        $(this.canvas_height).on("change", () => this.on_resize());
        $(this.opacity).on("change", () => this.on_opacity_changed());
        $(this.z_index).on("change", () => this.on_z_index_changed());
        $(this.visibility).on("change", () => this.on_visibility_changed());
        $(this.element_list).on("change", () => {
            let element = this.elements.get(this.element_list.value);
            if (element) {
                this.on_element_clicked(null, element);
            } else {
                this.rebuild_element_list(); // element was deleted and shouldn't be in the list anymore
            }
        });

        this.canvas_width.value = "1920";
        this.canvas_height.value = "1080";
        load_settings(); // load first because resize calls save settings which would override some config values with the defaults
        this.on_resize();

        requestAnimationFrame(() => this.draw());
    }

    /* Drawing */

    draw_mode_overlay() {
        if (this.mode_axis == MODE_AXIS.X || this.mode_axis == MODE_AXIS.XY) {
            // draw x axis
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.selected_element.tf().y + this.selected_element.tf().height / 2);
            this.ctx.lineTo(this.editor_canvas.width, this.selected_element.tf().y + this.selected_element.tf().height / 2);
            this.ctx.strokeStyle = "red";
            this.ctx.stroke();
        }

        if (this.mode_axis == MODE_AXIS.Y || this.mode_axis == MODE_AXIS.XY) {
            // draw y axis
            this.ctx.beginPath();
            this.ctx.moveTo(this.selected_element.tf().x + this.selected_element.tf().width / 2, 0);
            this.ctx.lineTo(this.selected_element.tf().x + this.selected_element.tf().width / 2, this.editor_canvas.height);
            this.ctx.strokeStyle = "green";
            this.ctx.stroke();
        }
    }

    handle_edit_modes(e) {
        if (this.current_mode == EDIT_MODE.SCALE) {
            //  calculate distance from drag offset to element center
            let dx = this.initial_position.x - this.selected_element.tf().x;
            let dy = this.initial_position.y - this.selected_element.tf().y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            // calculate distance from mouse to element center
            dx = this.mouse_pos[0] - (this.selected_element.tf().x);
            dy = this.mouse_pos[1] - (this.selected_element.tf().y);

            let mouse_distance = Math.sqrt(dx * dx + dy * dy);

            // calculate scale factor
            let scale_factor = mouse_distance / distance;

            // update element
            switch (this.mode_axis) {
                case MODE_AXIS.X:
                    this.selected_element.tf().scale_x = this.initial_element_size.x * scale_factor;
                    break;
                case MODE_AXIS.Y:
                    this.selected_element.tf().scale_y = this.initial_element_size.y * scale_factor;
                    break;
                case MODE_AXIS.XY:
                    this.selected_element.tf().scale_x = this.initial_element_size.x * scale_factor;
                    this.selected_element.tf().scale_y = this.initial_element_size.y * scale_factor;
                    break;
            }
            // limit scale factor to 0.1 - 10
            // this.selected_element.tf().scale_x = clamp(this.selected_element.tf().scale_x, 0.1, 10);
            // this.selected_element.tf().scale_y = clamp(this.selected_element.tf().scale_y, 0.1, 10);
            this.selected_element.update();
            send_command_transform_element(this, this.selected_element);
            this.update_selected_element();
        } else if (this.current_mode == EDIT_MODE.MOVE) {
            // calculate difference between mouse pos and scale start
            let dx = this.mouse_pos[0] - this.initial_position.x;
            let dy = this.mouse_pos[1] - this.initial_position.y;
            switch (this.mode_axis) {
                case MODE_AXIS.X:
                    this.selected_element.tf().x = Math.round(this.initial_element_size.x + dx);
                    break;
                case MODE_AXIS.Y:
                    this.selected_element.tf().y = Math.round(this.initial_element_size.y + dy);
                    break;
                case MODE_AXIS.XY:
                    this.selected_element.tf().x = Math.round(this.initial_element_size.x + dx);
                    this.selected_element.tf().y = Math.round(this.initial_element_size.y + dy);
                    break;
            }

            send_command_transform_element(this, this.selected_element);
            this.selected_element.update();
            this.update_selected_element();
        } else if (this.current_mode == EDIT_MODE.MOVE_CANVAS) {
            let dx = this.last_move_event.clientX - this.initial_position.ux;
            let dy = this.last_move_event.clientY - this.initial_position.uy;
            this.editor_offset = [this.initial_editor_offset[0] + dx / this.editor_zoom, this.initial_editor_offset[1] + dy / this.editor_zoom];

            this.player_container.style.transform = `scale(${this.editor_zoom}) translate(${this.editor_offset[0]}px, ${this.editor_offset[1]}px)`;
        } else if (this.current_mode == EDIT_MODE.ROTATE) {
            // calculate the vectore from scale start to element center
            let dx = this.initial_position.lx - (this.selected_element.tf().x + this.selected_element.tf().width / 2);
            let dy = this.initial_position.ly - (this.selected_element.tf().y + this.selected_element.tf().height / 2);

            // calculate the vector from mouse pos to element center
            let dx2 = this.last_move_event.localX - (this.selected_element.tf().x + this.selected_element.tf().width / 2);
            let dy2 = this.last_move_event.localY - (this.selected_element.tf().y + this.selected_element.tf().height / 2);

            // calculate angle between vectors
            let angle = Math.atan2(dy2, dx2) - Math.atan2(dy, dx);
            console.log(angle)
            // calculate new rotation
            let new_rotation = Math.round(this.initial_element_size.rotation + angle * 180 / Math.PI);

            switch (this.mode_axis) {
                case MODE_AXIS.X:
                    this.selected_element.tf().rotation_x = new_rotation;
                    break;
                case MODE_AXIS.Y:
                    this.selected_element.tf().rotation_y = new_rotation;
                    break;
                case MODE_AXIS.Z:
                    this.selected_element.tf().rotation_z = new_rotation;
                    break;
            }

            this.selected_element.update();
            send_command_transform_element(this, this.selected_element);
            this.update_selected_element();
        }
    }

    update_zoom_and_offset() {
        this.player_container.style.transform = `scale(${this.editor_zoom}) translate(${this.editor_offset[0]}px, ${this.editor_offset[1]}px)`;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.editor_canvas.width, this.editor_canvas.height);
        if (this.selected_element) {

            this.draw_mode_overlay();
        }

        requestAnimationFrame(() => this.draw());
    }

    /* Events */

    on_connection_changed() {
        if (this.connected) {
            this.connection_indicator.classList.remove("disconnected");
            this.connection_indicator.classList.add("connected");
            this.connection_indicator.title = "WebSocket Connected";
        } else {
            this.connection_indicator.classList.remove("connected");
            this.connection_indicator.classList.add("disconnected");
            this.connection_indicator.title = "WebSocket Disconnected";
        }
    }

    on_element_clicked(_e, element) {
        this.select_element(element);
        element.html.classList.add("selected-element");
    }

    on_key_up(e) {
        if (e.code == "Space") {
            for (let [_, el] of this.elements) {
                el.html.classList.remove("highlighted-element");
            }
            this.space_pressed = false;
        }
    }

    on_key_down(e) {
        if ($('#settings-window').contains(e.target) || active_modal != null || $('#element-list-window').contains(e.target))
            return;

        if (e.code == "Space") {
            for (let [_, el] of this.elements) {
                el.html.classList.add("highlighted-element");
            }
            this.space_pressed = true;
        }
        for (let keybind of editor_keybinds) {
            if (e.code == keybind.code) {
                if ((!keybind.ctrl ^ e.ctrlKey) && (!keybind.shift ^ e.shiftKey))
                    keybind.function(this, e);
            }
        }
    }

    on_resize() {
        if (!this.main_container)
            return;
        this.container.style.width = this.canvas_width.value + "px";
        this.container.style.height = this.canvas_height.value + "px";
        this.editor_canvas.width = this.canvas_width.value;
        this.editor_canvas.height = this.canvas_height.value;

        // calculate aspect ratio
        let aspect_ratio = this.main_container.clientWidth / this.main_container.clientHeight;

        // switch between portrait and landscape mode
        if (aspect_ratio > 1) {
            this.player_container.classList.remove("portrait-player");
            this.player_container.classList.add("landscape-player");
            this.in_landscape_mode = true;
        } else {
            this.player_container.classList.remove("landscape-player");
            this.player_container.classList.add("portrait-player");
            this.in_landscape_mode = false;
        }

        // recalculate scale factor
        if (this.in_landscape_mode) {
            this.scale_factor = this.player_container.clientWidth / this.container.clientWidth;

        } else {
            this.scale_factor = this.player_container.clientHeight / this.container.clientHeight;
        }
        this.container.style.transform = `scale(${this.scale_factor})`;
        this.editor_canvas.style.transform = `scale(${this.scale_factor})`;
        save_settings();
    }

    on_mouse_down(e) {
        if (this.current_mode === EDIT_MODE.NONE) {
            // if left mouse button is pressed
            if (e.button == 0) {
                //this.select_element(null);

                // check if mouse wheel is pressed
            } else if (e.button == 1 && active_modal == null) {
                this.enter_mode(EDIT_MODE.MOVE_CANVAS, MODE_AXIS.NONE);
            }
        }
        if (e.button == 0)
            this.leave_mode();
    }

    on_mouse_up(_e) {
        this.leave_mode();
    }

    on_mouse_move(e) {
        this.mouse_pos = [e.clientX / this.scale_factor / this.editor_zoom, e.clientY / this.scale_factor / this.editor_zoom];
        this.last_move_event = e;
        let rect = this.editor_canvas.getBoundingClientRect();
        this.last_move_event.localX = (this.last_move_event.clientX - rect.left) / this.scale_factor / this.editor_zoom;
        this.last_move_event.localY = (this.last_move_event.clientY - rect.top) / this.scale_factor / this.editor_zoom;

        if (this.initial_position.x == -1 && this.current_mode != EDIT_MODE.NONE) {
            this.initial_position.x = this.mouse_pos[0];
            this.initial_position.y = this.mouse_pos[1];
            this.initial_position.ux = e.clientX;
            this.initial_position.uy = e.clientY;
            this.initial_position.lx = this.last_move_event.localX;
            this.initial_position.ly = this.last_move_event.localY;
            this.initial_editor_offset = [...this.editor_offset];
        }
        this.handle_edit_modes(e);
    }

    on_element_added(element) {
        $(element.html).on("click", e => this.on_element_clicked(e, element));
        this.element_count++;
        this.rebuild_element_list();
    }

    on_opacity_changed() {
        if (this.selected_element) {
            this.selected_element.tf().opacity = this.opacity.value / 100;
            this.selected_element.update();
            send_command_transform_element(this, this.selected_element);
        }
    }

    on_z_index_changed() {
        if (this.selected_element) {
            this.selected_element.tf().z_index = Number(this.z_index.value);
            this.selected_element.update();
            send_command_transform_element(this, this.selected_element);
            this.rebuild_element_list();
        }
    }

    on_visibility_changed() {
        if (this.selected_element) {
            this.selected_element.tf().visible = this.visibility.checked;
            this.selected_element.update();
            send_command_transform_element(this, this.selected_element);
        }
    }

    on_pivot_changed(option) {
        if (this.selected_element) {
            this.pivot_options.forEach(option => option.classList.remove("selected"));
            option.classList.add("selected");
            if (option.classList.contains("horizontal"))
                this.selected_element.tf().h_pivot = option.getAttribute("pivot");
            else
                this.selected_element.tf().v_pivot = option.getAttribute("pivot");
            this.selected_element.update();
            this.update_selected_element();
            send_command_transform_element(this, this.selected_element);
        }
    }

    on_element_name_changed() {
        if (this.selected_element) {
            this.selected_element.data.name = this.element_name.value;
            send_command_update_element(this, this.selected_element);
            this.rebuild_element_list();
        }
    }

    on_scroll(e) {
        if (active_modal == null) {
            this.editor_zoom += (e.deltaY < 0 ? 1 : -1) * (this.space_pressed ? 0.01 : 0.1);
            this.editor_zoom = clamp(this.editor_zoom, 0.1, 1);
            this.player_container.style.transform = `scale(${this.editor_zoom}) translate(${this.editor_offset[0]}px, ${this.editor_offset[1]}px)`;
        }
    }

    /* Element handling */

    rebuild_element_list() {
        this.element_list.innerHTML = "";
        let elements = [];
        for (let [_, el] of this.elements) {
            elements.push(el);
        }

        // reverse array
        elements.reverse();

        elements.sort((a, b) => b.tf().z_index - a.tf().z_index);
        elements.forEach(el => {
            let option = document.createElement("option");
            option.value = el.id();
            option.innerHTML = el.data.name;
            this.element_list.appendChild(option);
        });
        this.element_list.value = this.selected_element ? this.selected_element.id() : "";
    }

    add_element(element) {
        this.elements.set(element.id(), element);
        send_command_add_element(this, element);

        this.container.appendChild(element.html);
        element.update();
        this.on_element_added(element);
        this.select_element(element);
        element.html.classList.add("selected-element");
        if (element.tickable())
            this.tickable_elements.push(element);
    }

    select_element(element) {
        if (this.selected_element === element)
            return;
        if (this.selected_element)
            this.selected_element.html.classList.remove("selected-element");

        this.element_list.value = element ? element.id() : "";

        // hide all element settings
        this.selected_element = element;
        this.element_handlers.forEach(element_handler => element_handler.hide_settings());

        // update element properties in sidebar
        if (element) {

            this.update_selected_element();

            // find element handler for this element type
            let element_handler = this.element_handlers.find(element_handler => element_handler.type == element.type());
            element_handler.show_settings(element);
        }
        let windows = this.main_container.getElementsByClassName("window");
        for (let i = 0; i < windows.length; i++) {
            if (element)
                windows[i].classList.remove("inactive");
            else
                windows[i].classList.add("inactive");
        }
    }

    update_selected_element() {
        if (this.selected_element == null)
            return;
        let element_handler = this.element_handlers.find(element_handler => element_handler.type == this.selected_element.type());
        element_handler.show_settings(this.selected_element);
        this.pos_x.value = this.selected_element.tf().x;
        this.pos_y.value = this.selected_element.tf().y;
        this.width.value = this.selected_element.tf().width;
        this.height.value = this.selected_element.tf().height;
        this.z_index.value = Number(this.selected_element.tf().z_index);
        this.opacity.value = this.selected_element.tf().opacity * 100;
        this.visibility.checked = this.selected_element.tf().visible;
        this.element_name.value = this.selected_element.data.name;

        this.pivot_options.forEach(option => option.classList.remove("selected"));
        $(`#pivot-h-${this.selected_element.tf().h_pivot}`).classList.add("selected");
        $(`#pivot-v-${this.selected_element.tf().v_pivot}`).classList.add("selected");
    }

    is_editor() { return true; }

    chrome_scale_fuckery(val) {
        return IS_CHROME ? val / this.scale_factor : val;
    }

    enter_mode(mode, axis = MODE_AXIS.XY) {
        this.current_mode = mode;
        this.mode_axis = axis;

        for (let i = 0; i < windows.length; i++) {
            windows[i].classList.add('no-input');
        }
    }

    leave_mode() {
        this.current_mode = EDIT_MODE.NONE;
        this.mode_axis = MODE_AXIS.NONE;
        this.initial_position.x = -1;
        this.initial_position.y = -1;
        for (let i = 0; i < windows.length; i++) {
            windows[i].classList.remove('no-input');
        }
    }

    get_next_element_id() {
        return this.element_count + 1;
    }

    make_unique_element_name(element_name) {
        let name_no_numbers = element_name.replace(/\d+$/, '');
        name_no_numbers += " " + this.get_next_element_id();
        return name_no_numbers;
    }
}