// JSON Editor for the tools of the robot
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

var tools_holder = $("#tools_editor")[0];

// Initialize the tools editor
var tools_editor = new JSONEditor(tools_holder, {schema: {$ref: "/get/schema/tools"}});

// Wait for editor to be ready (required because Ajax is used)
tools_editor.on("ready",function() {
    tools_editor.validate();
    tools_editor.setValue(initial_tools);
    $('.json-editor-btn-collapse').on("click", setHeightSidebar);
});

// Listen for changes
tools_editor.on("change", setHeightSidebar);

// Overwrite previous tools with current content
function save_tools() {
    var errors = tools_editor.validate();
    if (errors.length == 0)
        BootstrapDialog.confirm({
            title: 'Overwrite tools configuration?',
            message: 'Are you sure you wish to overwrite the previous tools configuration with this one? This change cannot be reverted.',
            type: BootstrapDialog.TYPE_WARNING,
            btnOKLabel: 'Confirm',
            callback: function(result){
                if(result) {
                    var content = btoa(JSON.stringify(tools_editor.getValue()));
                    window.location.assign(window.location.href + '/save/' + content);
                }
            }
        });
    else
        BootstrapDialog.alert({
            title: 'Error',
            message: 'Cannot save a configuration that contain errors.',
            type: BootstrapDialog.TYPE_DANGER
        });
}

