// JavaScript file used in Protocol Editor page

var p_name;
var p_author;
var p_description;
var open_protocol;

window.onload = function() {
    setHeightSidebar();
    ros_init();
    add_topic();

    open_protocol = $('#open-protocol')[0];
    open_protocol.addEventListener('change', open_protocol_file, false);

    p_name = $('#protocol_name')[0];
    p_author = $('#protocol_author')[0];
    p_description = $('#protocol_description')[0];
};

// ROS topic related to this page
function add_topic() {
    start_protocol_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Start_Protocol',
        messageType: 'std_msgs/String'
    });
}

// Export current page to a JSON string.
// The refs variable is a boolean, to include the labware references or not.
function get_json_protocol(refs){
    var prot = {};
    prot['name'] = p_name.value;
    prot['author'] = p_author.value;
    prot['description'] = p_description.value;
    prot['instructions'] = instructions.getValue();
    if (refs) {
        prot['operator'] = operator;
        prot['refs'] = get_labware_ajax();
    }
    return JSON.stringify(prot);
}

// Ajax request performed to fetch the validated labware
function get_labware_ajax() {
    var ret;
    $.ajax({
        'type': 'GET',
        'url': '/get/schema/labware',
        async: false,
        'success': function(labware){
            ret = JSON.parse(labware);
        }
    });

    return ret;
}

// JSON Editor configuration
JSONEditor.defaults.options = {
    ajax: true,
    disable_array_delete_last_row: true,
    disable_edit_json: true,
    disable_properties: true,
    iconlib: "bootstrap3",
    no_additional_properties: true,
    required_by_default: true,
    theme: "bootstrap3"
}

// Save current protocol to a file
function save_protocol() {
    var protocol = get_json_protocol(false);

    console.log(protocol);

    var blob = new Blob([protocol], {
        type: 'text/plain;charset=utf-8'
    });
    var filename = 'BioBot Protocol - ' + get_date_string() + '.json';
    saveAs(blob, filename);
}

// Load JSON protocol from file
function open_protocol_file(e) {
    var file = e.target.files[0];
    if (!file || !file.name.endsWith('.json'))
        return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = JSON.parse(e.target.result);

        p_name.value = contents['name'];
        p_author.value = contents['author'];
        p_description.value = contents['description'];
        instructions.setValue(contents['instructions']);
    };
    reader.readAsText(file);
    this.value = null;
}

var instructions_holder = $("#instructions_holder")[0];

// Initialize the instructions editor
var instructions = new JSONEditor(instructions_holder, {schema: {$ref: "/get/schema/instructions"}});

// Wait for editor to be ready (required because Ajax is used)
instructions.on("ready",function() {
    instructions.validate();
    $('.json-editor-btn-collapse').on("click", setHeightSidebar);
});

// Listen for changes and make steps red if they contain errors
instructions.on("change",  function() {
    setHeightSidebar();
    console.log(JSON.stringify(instructions.getValue()));
    var errors = instructions.validate();
    var rows = instructions.root.rows;
    var tmp;

    for (var i = 0; i < rows.length; i++)
        rows[i].tab.style.color = "";

    for (var i = 0; i < errors.length; i++) {
        tmp = parseInt(errors[i].path.split('.')[1]);
        rows[tmp].tab.style.color = "red";
    }
});

// Send the current protocol to the robot
function start_protocol() {
    var errors_protocol = instructions.validate();
    var data = get_json_protocol(true);

    if (errors_protocol.length > 0 || JSON.parse(data)['instructions'].length == 0){
        BootstrapDialog.alert({
            title: 'Error',
            message: 'Cannot start a protocol that contain errors or has no instruction.',
            type: BootstrapDialog.TYPE_DANGER
        });
    } else {
        BootstrapDialog.confirm({
            title: 'Start Protocol',
            message: 'Are you sure you wish to start the current biological protocol?',
            type: BootstrapDialog.TYPE_INFO,
            btnOKLabel: 'Confirm',
            callback: function(result){
                if(result) {
                    var protocol_msg = new ROSLIB.Message({
                        data: data
                    });

                    console.log(protocol_msg.data)

                    start_protocol_topic.publish(protocol_msg);
                }
            }
        });
    }
}

