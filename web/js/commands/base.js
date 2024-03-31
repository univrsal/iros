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

function get_commands() {
    return new Map([
        ["transform", command_transform_element],
        ["add", command_add_element],
        ["delete", command_delete_element],
        ["update", command_update_element],
        ["move", command_move_element],
        ["scale", command_scale_element],
        ["rotate", command_rotate_element],
        ["ping", command_ping],
        ["pong", command_pong],
        ["cursormove", command_cursor_move],
    ]);
}

var outstanding_ping_command_id = null;
var user_map = new Map();

function command_cursor_move(view, data) {
    if (!view.is_editor())
        return;
    view.update_cursor_info(data);
}

function send_command_cursor_move(view, x, y) {
    view.send({ type: "cursormove", args: { x, y, id: view.id }, session: view.session_id });
}

function send_command_ping(view) {
    user_map.clear();
    outstanding_ping_command_id = Math.floor(Math.random() * 1000000);
    view.send({ type: "ping", args: { editor_timestamp: Date.now(), id: outstanding_ping_command_id }, session: view.session_id });
}

function send_command_pong(view, start_timestamp, ping_id) {
    view.send({ type: "pong", args: { start_timestamp, ping_id, viewer_id: view.id, is_editor: view.is_editor() }, session: view.session_id });
}

function command_ping(view, data) {
    send_command_pong(view, data.editor_timestamp, data.id);
}

function command_pong(view, data) {
    if (!view.is_editor()) // don't handle pongs in viewer mode
        return;
    if (outstanding_ping_command_id == data.id) {
        let rtt = Date.now() - data.start_timestamp;
        view.update_rtt(rtt);
        outstanding_ping_command_id = null;
    }
    user_map.set(data.viewer_id, { rtt: data.rtt, is_editor: data.is_editor });
    view.update_user_info(user_map);
}

function send_command_move_element(view, element) {
    view.send({
        type: "move", args: {
            id: element.id(),
            pos: { x: element.tf().x, y: element.tf().y },
        }, session: view.session_id
    });
}

function command_move_element(view, data) {
    var element = view.elements.get(data.id);
    if (element == undefined)
        return;

    element.tf().x = data.pos.x;
    element.tf().y = data.pos.y;

    element.update();
    if (view.is_editor())
        view.update_selected_element();
}


function send_command_scale_element(view, element) {
    view.send({
        type: "scale", args: {
            id: element.id(),
            scale: { x: element.tf().scale_x, y: element.tf().scale_y },
        }, session: view.session_id
    });
}

function command_scale_element(view, data) {
    var element = view.elements.get(data.id);
    if (element == undefined)
        return;
    element.tf().scale_x = data.scale.x;
    element.tf().scale_y = data.scale.y;
    element.update();
    if (view.is_editor())
        view.update_selected_element();
}


function send_command_rotate_element(view, element) {
    view.send({
        type: "rotate", args: {
            id: element.id(),
            rotation: { x: element.tf().rotation_x, y: element.tf().rotation_y, z: element.tf().rotation_z },
        }, session: view.session_id
    });
}

function command_rotate_element(view, data) {
    var element = view.elements.get(data.id);
    if (element == undefined)
        return;
    element.tf().rotation_x = data.rotation.x;
    element.tf().rotation_y = data.rotation.y;
    element.tf().rotation_z = data.rotation.z;
    element.update();
    if (view.is_editor())
        view.update_selected_element();
}


function send_command_transform_element(view, element) {
    view.send({
        type: "transform", args: {
            id: element.id(),
            transform: element.data.transform,
        }, session: view.session_id
    });
}

function command_transform_element(view, data) {
    var element = view.elements.get(data.id);
    if (element == undefined)
        return;
    element.data.transform = data.transform;
    element.update();
    if (view.is_editor())
        view.update_selected_element();
}


function send_command_add_element(view, element) {
    view.send({ type: "add", args: element.data, session: view.session_id });
}

function command_add_element(view, data) {
    let new_element = create_element(view, data.type, data);
    if (new_element != null) {
        view.elements.set(new_element.id(), new_element);
        view.container.appendChild(new_element.html);
        new_element.update();
        if (view.is_editor())
            view.on_element_added(new_element);
        if (new_element.tickable())
            view.tickable_elements.push(new_element);
    }
}


function send_command_delete_element(view, id) {
    view.send({ type: "delete", args: { id }, session: view.session_id });
}

function command_delete_element(view, args) {
    if (view.is_editor() && view.selected_element && view.selected_element.id() == args.id)
        view.select_element(null);
    // remove from tickable elements
    let index = view.tickable_elements.indexOf(view.elements.get(args.id));
    if (index > -1)
        view.tickable_elements.splice(index, 1);
    view.elements.get(args.id).delete();
    view.elements.delete(args.id);
    if (view.is_editor())
        view.rebuild_element_list();
}


function send_command_update_element(view, element) {
    view.send({ type: "update", args: element.data, session: view.session_id });
}

function command_update_element(view, data) {
    let element = view.elements.get(data.id);
    if (element == undefined)
        return;
    element.data = data;
    element.update();
    if (view.is_editor())
        view.update_selected_element();
}
