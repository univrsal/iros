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
var favorites_modal = null;
var favorite_list = [];
var favorite_in_delete_mode = false;
var favorite_hint_label = null;
var favorite_delete_mode_button = null;

function build_favorites_list() {
    let list = $("#favorites-list");
    list.innerHTML = "";
    for (let i = 0; i < favorite_list.length; i++) {
        let fav = favorite_list[i];
        fav.id = undefined; // will be generated on creation
        let element = $(`<div class="favorites-element"><img class="favorites-element-icon" src="../img/add-${fav.type}.svg" /><div class="favorites-element-name">${fav.name}</div></div>`);

        element.on("click", (e) => {
            if (favorite_in_delete_mode) {
                // find the parent with the class "favorites-element"
                let parent = e.target;
                while (!parent.classList.contains("favorites-element")) {
                    parent = parent.parentNode;
                }
                parent.classList.toggle("marked-for-deletion");
                return;
            }
            fav.name = edt.make_unique_element_name(fav.name);
            let new_element = create_element(edt, fav.type, fav);
            new_element.tf().visible = false;
            new_element.tf().x = 10;
            new_element.tf().y = 10;
            edt.add_element(new_element);
            close_modal();
        });
        list.append(element);
    }
}

function favorite_selected_element() {
    if (edt.selected_element) {
        favorite_list.push(edt.selected_element.data);
        localStorage.setItem("favorites", JSON.stringify(favorite_list));
        build_favorites_list();
    }
}

function favorite_toggle_delete_mode() {
    favorite_in_delete_mode = !favorite_in_delete_mode;
    if (favorite_in_delete_mode) {
        favorite_hint_label.innerHTML = "Click on a favorite to marke it for removal";
        favorite_delete_mode_button.innerHTML = "Done";
    } else {
        favorite_hint_label.innerHTML = "Favorite an element by selecting it and pressing 'F'";
        favorite_delete_mode_button.innerHTML = "Delete mode";

        let new_favorites = [];
        let list = $("#favorites-list");
        for (let i = 0; i < list.children.length; i++) {
            let element = list.children[i];
            if (!element.classList.contains("marked-for-deletion")) {
                new_favorites.push(favorite_list[i]);
            }
        }
        favorite_list = new_favorites;
        localStorage.setItem("favorites", JSON.stringify(favorite_list));
        build_favorites_list();
    }
}

$(document).ready(() => {
    favorites_modal = $("#favorites-modal");
    favorite_hint_label = $("#favorites-hint-label");
    favorite_delete_mode_button = $("#favorites-delete-mode");
    // load favorites from local storage
    let favs = localStorage.getItem("favorites");
    if (favs) {
        favorite_list = JSON.parse(favs);
    }
    build_favorites_list();
});
