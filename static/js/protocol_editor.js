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

function add_topic() {
    start_protocol_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Start_Protocol',
        messageType: 'std_msgs/String'
    });
}

function get_json_protocol(){
    return JSON.stringify({
        'name': p_name.value,
        'author': p_author.value,
        'description': p_description.value,
        'refs': labware.getValue(),
        'instructions': instructions.getValue()
    });
}

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

function save_protocol() {
    var protocol = get_json_protocol();

    console.log(protocol);

    var blob = new Blob([protocol], {
        type: 'text/plain;charset=utf-8'
    });
    var filename = 'BioBot Protocol - ' + get_date_string() + '.json';
    saveAs(blob, filename);
}

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
        labware.setValue(contents['refs']);
        instructions.setValue(contents['instructions']);
    };
    reader.readAsText(file);
    this.value = null;
}

var labware_holder = $("#labware_holder")[0];

// Initialize the labware editor
var labware = new JSONEditor(labware_holder, {schema: {$ref: "/get/schema/labware"}});

// Wait for editor to be ready (required because Ajax is used)
labware.on("ready",function() {
    labware.validate();
    $('.json-editor-btn-collapse').on("click", setHeightSidebar);
});

// Listen for changes
labware.on("change", setHeightSidebar);

var instructions_holder = $("#instructions_holder")[0];

// Initialize the instructions editor
var instructions = new JSONEditor(instructions_holder, {schema: {$ref: "/get/schema/instructions"}});

// Wait for editor to be ready (required because Ajax is used)
instructions.on("ready",function() {
    instructions.validate();
    $('.json-editor-btn-collapse').on("click", setHeightSidebar);
});

// Listen for changes
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

function start_protocol() {
    var errors_labware = labware.validate();
    var errors_protocol = instructions.validate();

    if (errors_labware.length > 0 || errors_protocol.length > 0){
        BootstrapDialog.alert({
            title: 'Error',
            message: 'Cannot start a protocol that contain errors',
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
                        data: get_json_protocol()
                    });

                    start_protocol_topic.publish(protocol_msg);
                }
            }
        });
    }
}

