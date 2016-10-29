var p_name;
var p_author;
var p_description;
var open_protocol;

window.onload = function() {
    setHeightSidebar();
    ros_init();

    open_protocol = $('#open-protocol')[0];
    open_protocol.addEventListener('change', open_protocol_file, false);

    p_name = $('#protocol_name')[0];
    p_author = $('#protocol_author')[0];
    p_description = $('#protocol_description')[0];
};

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
    var refs = labware.getValue();
    var cont = containers.getValue();
    refs.forEach(function(array, index) {
        refs[index]['id'] = index;
    });
    refs = refs.concat(cont);

    var protocol = JSON.stringify({
        'name': p_name.value,
        'author': p_author.value,
        'description': p_description.value,
        'refs': refs,
        'instructions': instructions.getValue(),
        'nb_containers': cont.length
    });

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
        instructions.setValue(contents['instructions']);

        var refs = [];
        var c_r = contents['refs'];
        var len = c_r.length - contents['nb_containers'];
        for(var i = 0; i < len; i++) {
            refs[i] = {'name': c_r[0]['name']};
            c_r.shift();
        }

        labware.setValue(refs);
        containers.setValue(c_r);

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

var containers_holder = $("#containers_holder")[0];

// Initialize the containers editor
var containers = new JSONEditor(containers_holder, {schema: {$ref: "/get/schema/containers"}});

// Wait for editor to be ready (required because Ajax is used)
containers.on("ready",function() {
    containers.validate();
    $('.json-editor-btn-collapse').on("click", setHeightSidebar);
});

// Listen for changes
containers.on("change",  function() {
    setHeightSidebar();
    var rows = containers.root.rows;
    var value = containers.getValue();
    var cur;
    var ids = [];

    for (var i = 0; i < rows.length; i++) {
        cur = value[i]['id'];
        if ($.inArray(cur, ids) >= 0)
            rows[i].tab.style.color = "red";
        else {
            rows[i].tab.style.color = "";
            ids.push(cur);
        }
    }
});

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


