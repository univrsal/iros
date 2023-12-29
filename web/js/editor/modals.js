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

var modal_container = null;
var active_modal = null;

$(document).ready(() => {
    modal_container = $("#modal-container");
    $(modal_container).on("click", function (event) {
        if (event.target == modal_container) {
            close_modal();
        }
    });
    $(modal_container).on("keydown", function (event) {
        if (event.key === "Escape") {
            close_modal();
        }
    });
});

function open_modal(dialog) {
    modal_container.style.display = "block";
    dialog.style.display = "grid";
    modal_container.classList.remove("invisible");
    modal_container.classList.add("visible");
    active_modal = dialog;
}

function close_modal() {
    modal_container.classList.remove("visible");
    modal_container.classList.add("invisible");
    setTimeout(() => {
        modal_container.style.display = "none";
        active_modal.style.display = "none";
        active_modal = null;
    }, 300);
}