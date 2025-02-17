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

var IS_CHROME = navigator.userAgent.indexOf('Chrome') === -1 ? false : true;

// enum for resize directions
const EDIT_MODE = {
  NONE: -1,
  MOVE: 0,
  SCALE: 1,
  ROTATE: 2,
  MOVE_CANVAS: 3,
};

const MODE_AXIS = {
  NONE: -1,
  X: 0,
  Y: 1,
  Z: 2,
  XY: 3,
};

function get_cookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function set_cookie(name, value, days) {
  let date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
}

function hex_to_rgba(hex) {
  let bigint = parseInt(hex.substring(1), 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, 1)`;
}

function $(query) {
  var result = null;
  if (typeof query === 'object') {
    result = query;
  } else if (query[0] === '<') {
    var temp = document.createElement('div');
    temp.innerHTML = query;
    result = temp.firstChild;
  } else {
    let qresult = document.querySelector(query);
    if (qresult.length === undefined) result = qresult;
    else if (qresult[0] !== undefined) result = qresult[0];
    else result = qresult;
  }

  if (result)
    result.on = (id, handler) =>
      result.addEventListener(id, (event) => handler(event));

  if (result === document)
    result.ready = (handler) =>
      document.addEventListener('DOMContentLoaded', () => handler());

  return result;
}

function blob_to_base64(blob) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function blob_to_text(blob) {
  return new Promise((resolve) => {
    let reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}

function parse_time_to_seconds(time) {
  let seconds = 0;
  let parts = time.split(':');
  if (parts.length == 1) {
    seconds = parseInt(parts[0]);
  } else if (parts.length == 2) {
    seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length == 3) {
    seconds =
      parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return seconds;
}

function seconds_to_time(seconds, show_hours_and_miliseconds = true) {
  let hours = Math.floor(seconds / 3600);
  let minutes = Math.floor((seconds - hours * 3600) / 60);
  seconds = seconds - hours * 3600 - minutes * 60;
  // add leading zeros
  hours = hours.toString().padStart(2, '0');
  minutes = (minutes % 60).toString().padStart(2, '0');

  let milliseconds = Math.floor((seconds - Math.floor(seconds)) * 1000);
  milliseconds = milliseconds.toString().padStart(2, '0');
  // limit milliseconds to 2 digits
  milliseconds = milliseconds.substring(0, 2);

  seconds = (Math.floor(seconds) % 60).toString().padStart(2, '0');

  if (show_hours_and_miliseconds)
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  else if (hours === '00') return `${minutes}:${seconds}`;
  else return `${hours}:${minutes}:${seconds}`;
}

function read_data_from_clipboard() {
  return new Promise((resolve) => resolve(navigator.clipboard.read()))
    .then((data) => {
      for (let item of data) {
        for (let type of item.types) {
          switch (type) {
            case 'image/png':
            case 'image/jpeg':
            case 'image/gif':
            case 'text/plain':
              return item.getType(type);
          }
        }
      }
    })
    .then((data) => {
      if (data.type === 'text/plain') return blob_to_text(data);
      else return blob_to_base64(data);
    });
}

function normalize(x, y) {
  let length = Math.sqrt(x * x + y * y);
  return [x / length, y / length];
}

function vector_to_angle(x, y) {
  [x, y] = normalize(x, y);
  let angle = Math.acos(y);
  if (x > 0) angle = Math.PI + angle;
  else angle = Math.PI - angle;
  return (angle * 180) / Math.PI;
}

function lock_mouse(edit) {
  edit.requestPointerLock =
    edit.requestPointerLock ||
    edit.mozRequestPointerLock ||
    edit.webkitRequestPointerLock;

  edit.requestPointerLock();
}

function unlock_mouse() {
  document.exitPointerLock =
    document.exitPointerLock ||
    document.mozExitPointerLock ||
    document.webkitExitPointerLock;

  document.exitPointerLock();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}
