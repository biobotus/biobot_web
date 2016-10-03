var default_deck = 'static/refs/deck.txt';
var default_protocol = 'static/refs/pipette.json';

var deck_item_topic;
var start_protocol_topic;

var deck;
var open_deck;
var deck_warning;
var protocol;
var open_protocol;
var protocol_warning;

window.onload = function() {
    ros_init();
    add_topic();

    deck = document.getElementById('deck')
    open_deck = document.getElementById('open-deck')
    deck_warning = document.getElementById('deck-warning')
    open_deck.addEventListener('change', open_deck_file, false);
    deck.addEventListener('drop', drag_drop_deck, false);

    protocol = document.getElementById('protocol')
    open_protocol = document.getElementById('open-protocol')
    protocol_warning = document.getElementById('protocol-warning')
    open_protocol.addEventListener('change', open_protocol_file, false);
    protocol.addEventListener('drop', drag_drop_protocol, false);

    window.addEventListener('dragover', preventDefault, false);
    window.addEventListener('drop', preventDefault, false);
};

function clear_deck() {
    clear_deck_warning()
    deck.disabled = false
    deck.value = ''
    open_deck.value = ''
}

function clear_protocol() {
    clear_protocol_warning()
    protocol.disabled = false
    protocol.value = ''
    open_protocol.value = ''
}

function load_default_deck() {
    clear_deck_warning()
    deck.disabled = false

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            deck.value = xhttp.responseText;
        }
    };
    xhttp.open('GET', default_deck, true);
    xhttp.send();
}

function load_default_protocol() {
    clear_protocol_warning()
    protocol.disabled = false

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState == 4 && xhttp.status == 200) {
            protocol.value = xhttp.responseText;
        }
    };
    xhttp.open('GET', default_protocol, true);
    xhttp.send();
}

function open_deck_file(e) {
    $('#deck-buttons').removeClass('open');
    clear_deck_warning()
    deck.disabled = false

    var file = e.target.files[0];
    if (!file || !file.name.endsWith('.txt')) {
        deck_warning.innerHTML = 'Invalid file. Accepted : .txt'
        deck.value = ''
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        deck.value = contents;
    };
    reader.readAsText(file);
    this.value = null
}

function open_protocol_file(e) {
    $('#protocol-buttons').removeClass('open');
    clear_protocol_warning()
    protocol.disabled = false

    var file = e.target.files[0];
    if (!file || !file.name.endsWith('.json')) {
        protocol_warning.innerHTML = 'Invalid file. Accepted : .json'
        protocol.value = ''
        return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = e.target.result;
        protocol.value = contents;
    };
    reader.readAsText(file);
    this.value = null
}

function preventDefault(e) {
    e.preventDefault();
}

function drag_drop_deck(e) {
    e.preventDefault();
    clear_deck_warning()
    open_deck.value = ''
    deck.disabled = false

    var file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.txt')) {
        deck_warning.innerHTML = 'Invalid file. Accepted : .txt'
        deck.value = ''
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        deck.value = e.target.result;
    };
    reader.readAsText(file);
    return false;
};

function drag_drop_protocol(e) {
    e.preventDefault();
    clear_protocol_warning()
    open_protocol.value = ''
    protocol.disabled = false

    var file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.json')) {
        protocol_warning.innerHTML = 'Invalid file. Accepted : .json'
        protocol.value = ''
        return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
        protocol.value = e.target.result;
    };
    reader.readAsText(file);
    return false;
};

function save_deck() {
    var blob = new Blob([deck.value], {
        type: 'text/plain;charset=utf-8'
    });
    var filename = 'BioBot Deck - ' + get_date_string() + '.txt';
    saveAs(blob, filename);
}

function save_protocol() {
    var blob = new Blob([protocol.value], {
        type: 'text/plain;charset=utf-8'
    });
    var filename = 'BioBot Protocol - ' + get_date_string() + '.json';
    saveAs(blob, filename);
}

function send_deck_to_planner() {
    clear_deck_warning()
    deck.disabled = true

    // Remove blank lines in the text
    deck.value = deck.value.replace(/^(?=\n)$|^\s*|\s*$|\n\n+/gm, '');

    var len = deck.value.split('\n').length;
    if (len % 6 != 0) {
        deck_warning.innerHTML = 'Deck must be N*6 lines long'
        deck.disabled = false
        return
    }

    var deck_items = deck.value.match(/(?:^.*$\n?){1,6}/mg);
    for (item in deck_items) {
        var deck_lines = deck_items[item].split('\n');

        var c_x = parseFloat(deck_lines[3])
        var c_y = parseFloat(deck_lines[4])
        var c_z = parseFloat(deck_lines[5])

        if (isNaN(deck_lines[3]) || isNaN(deck_lines[4]) || isNaN(deck_lines[5])) {
            deck_warning.innerHTML = 'One of the coordinates is not a float'
            deck.disabled = false
            return
        }

        var deck_msg = new ROSLIB.Message({
            m_name: deck_lines[0],
            m_type: deck_lines[1],
            m_id: deck_lines[2],
            coord_x: c_x,
            coord_y: c_y,
            coord_z: c_z
        });

        console.log(deck_items[item])
        deck_item_topic.publish(deck_msg);
    }
}

function send_protocol_to_planner() {
    clear_protocol_warning()
    protocol.disabled = true

    try {
        JSON.parse(protocol.value)
    } catch (err) {
        protocol_warning.innerHTML = 'Invalid JSON file';
        protocol.disabled = false
        return
    }

    var protocol_msg = new ROSLIB.Message({
        data: protocol.value
    });

    start_protocol_topic.publish(protocol_msg);
}

function clear_deck_warning() {
    deck_warning.innerHTML = ''
}

function clear_protocol_warning() {
    protocol_warning.innerHTML = ''
}

function add_topic() {
    deck_item_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Deck_Item',
        messageType: 'biobot_ros_msgs/CoordinateMsgs'
    });

    start_protocol_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Start_Protocol',
        messageType: 'std_msgs/String'
    });
}

