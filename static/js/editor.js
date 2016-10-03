JSONEditor.defaults.options = {
    ajax: true,
    disable_array_delete_last_row: true,
    disable_edit_json: true,
    disable_properties: true,
    iconlib: "bootstrap3",
    required_by_default: true,
    theme: "bootstrap3"
}

function save_protocol() {

    var refs = labware.getValue();
    refs.forEach(function(part, index, array) {
        array[index] = {
            'name': part['name'],
            'id': index
        };
    });

    var protocol = JSON.stringify({
        'name': $('#protocol_name')[0].value,
        'author': $('#protocol_author')[0].value,
        'description': $('#protocol_description')[0].value,
        'refs': refs
    });

    console.log(protocol);

    var blob = new Blob([protocol], {
        type: 'text/plain;charset=utf-8'
    });
    var filename = 'BioBot Protocol - ' + get_date_string() + '.json';
    saveAs(blob, filename);
}
var labware_holder = $("#labware_holder")[0];

// Initialize the labware editor
var labware = new JSONEditor(labware_holder, {schema: {$ref: "/get/schema/labware"}});

// Wait for editor to be ready (required because Ajax is used)
labware.on("ready",function() {
    labware.validate();
});

// Listen for changes
labware.on("change",  function() {
    var errors = labware.validate();
    if (errors.length)
        labware_holder.style.color = "red";
    else
        labware_holder.style.color = "green";
});


