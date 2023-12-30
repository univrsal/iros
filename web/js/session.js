function generate_session() {
    let stream_url = $('#stream-link').value;
    let wh = $('#size').value;
    let width = "", height = "";

    if (stream_url === "") {
        alert("Please provide a url to your stream first!");
        return;
    }

    if (wh.indexOf('x') !== -1) {
        let split = wh.split('x');
        width = Number(split[0]);
        height = Number(split[1]);

        if (isNaN(width) || width < 1280)
            width = 1280;
        if (isNaN(height) || height < 720)
            height = 720;
    }

    // generate session uuid
    var session_uuid = uuidv4();
    let editor_link = "";
    let viewer_link = "";
    if (width === "" || height === "") {
        editor_link = `${document.location.origin}/editor?session=${session_uuid}&stream=${stream_url}`;
        viewer_link = `${document.location.origin}/viewer?session=${session_uuid}`;
    } else {
        editor_link = `${document.location.origin}/viewer?session=${session_uuid}&stream=${stream_url}`;
        viewer_link = `${document.location.origin}/viewer?session=${session_uuid}`;
    }

    // set links
    $('#editor-link').value = editor_link;
    $('#overlay-link').value = viewer_link;
    $('#link-container').classList.remove('hidden');
    $('#link-container').classList.add('visible');
}

function copy_link(id) {
    // copy link to clipboard
    var link = $("#" + id).value;
    navigator.clipboard.writeText(link);
}