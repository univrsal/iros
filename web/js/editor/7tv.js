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
var emote_search_modal = null;

$(document).ready(() => {
    emote_search_modal = $("#emote-search-modal");
    $("#emote-search-input").on("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            search_emotes();
        }
    });
});

function process_emote_search_result(data, offset = 0) {
    if (data.emotes === null) throw new Error("No emotes found");
    if (data.emotes.__typename !== "EmoteSearchResult") throw new Error("Invalid emote search result: " + data.emotes.__typename);
    let emotes = data.emotes;
    let emote_list = [];
    for (let i = 0; i < emotes.items.length; i++) {
        let emote = emotes.items[offset + i];
        let urls = [];
        let dimensions = [];

        for (let j = 0; j < emote.host.files.length; j++) {
            let file = emote.host.files[j];
            if (file.format === "AVIF") {
                urls.push(emote.host.url + "/" + file.name);
                dimensions.push([file.width, file.height]);
            }
        }
        let owner = emote.owner ? emote.owner.username : "";

        emote_list.push({
            name: emote.name,
            owner,
            dimensions,
            urls
        });
    }
    return emote_list;
}

function search_emote(name, page = 0, limit = 40) {
    return fetch("https://7tv.io/v3/gql", {
        "credentials": "omit",
        "headers": {
            "content-type": "application/json",
        },
        "body": `{"operationName":"SearchEmotes","variables":{"query":"${name}","limit":${limit},"page":${page},"sort":{"value":"popularity","order":"DESCENDING"},"filter":{"category":"TOP","exact_match":false,"case_sensitive":false,"ignore_tags":false,"zero_width":false,"animated":false,"aspect_ratio":""}},"query":"query SearchEmotes($query: String!, $page: Int, $sort: Sort, $limit: Int, $filter: EmoteSearchFilter) {\\n  emotes(query: $query, page: $page, sort: $sort, limit: $limit, filter: $filter) {\\n    count\\n    items {\\n      id\\n      name\\n      state\\n      trending\\n      owner {\\n        id\\n        username\\n        display_name\\n        style {\\n          color\\n          paint_id\\n          __typename\\n        }\\n        __typename\\n      }\\n      flags\\n      host {\\n        url\\n        files {\\n          name\\n          format\\n          width\\n          height\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}`,
        "method": "POST",
        "mode": "cors"
    })
}

var emote_search_page = 0;
var emote_cache = null;

function add_emote(index) {
    let emote = emote_cache[index];
    // use last url
    let url = emote.urls[emote.urls.length - 1];
    let dimensions = emote.dimensions[emote.dimensions.length - 1];
    let name = emote.name + " " + edt.get_next_element_id();
    add_image_element(url, name, dimensions[0], dimensions[1]);
    close_modal();
}

function search_emotes(page_limit = 40) {
    $("#emote-search-results").innerHTML = "";
    let search_input = $("#emote-search-input");
    let query = search_input.value;
    if (query === "") return;
    search_input.enabled = false;
    document.body.style.cursor = "wait";
    search_emote(query, emote_search_page).then((data) => {
        if (data.status !== 200) throw new Error("Invalid status code: " + data.status);
        if (data.ok !== true) throw new Error("Invalid status: " + data.statusText);

        return data.json();
    }).then(result => {

        search_input.enabled = true;
        let emotes = process_emote_search_result(result.data, emote_search_page * page_limit);
        emote_cache = emotes;
        for (let i = 0; i < emotes.length; i++) {
            let emote = emotes[i];
            let div = document.createElement("div");
            div.className = "emote-search-result";
            div.innerHTML = `<div onclick="add_emote(${i})" class="emote-search-result-image" style="background-image: url('${emote.urls[0]}')"></div><div class="emote-search-result-name" title="${emote.name}">${emote.name}</div><div class="emote-search-result-owner" title="${emote.owner}">${emote.owner}</div>`;
            $("#emote-search-results").appendChild(div);
        }
    }).catch((err) => {
        search_input.enabled = true;
        console.error(err);
        alert(err);
    }).finally(() => { document.body.style.cursor = "default"; });
}