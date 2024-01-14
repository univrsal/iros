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

class video_element extends audio_element {
    constructor(parent, data) {
        super(parent, data, "video");
    }
}

class video_element_handler extends audio_element_handler {
    constructor(edt) {
        super(edt, "video");
    }
}

function add_video_element(url = null, name = null, width = 480, height = 360) {
    if (url === null)
        url = "";
    if (name === null)
        name = `Video ${edt.get_next_element_id()}`;
    let data = {
        url,
        transform: {
            x: 0,
            y: 0,
            width,
            height,
        },
        name,
        loop: false,
        volume: 0.5,
        playback_rate: 1,
        paused: true,
        current_time: 0,
    };
    edt.add_element(create_element(edt, "video", data));
}