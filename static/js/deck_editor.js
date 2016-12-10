// JS file used in Deck Editor page

var open_deck;

window.onload = function() {
    setHeightSidebar();
    ros_init();

    open_deck = $('#open-deck')[0];
    open_deck.addEventListener('change', open_deck_file, false);
};

// Configure JSON Editor
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

// Save deck to file
function save_deck() {
    var items = JSON.stringify(deck.getValue());

    var blob = new Blob([items], {
        type: 'text/plain;charset=utf-8'
    });
    var filename = 'BioBot Deck - ' + get_date_string() + '.json';
    saveAs(blob, filename);
}

// Load deck file
function open_deck_file(e) {
    var file = e.target.files[0];
    if (!file || !file.name.endsWith('.json'))
        return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var contents = JSON.parse(e.target.result);
        deck.setValue(contents);
    };
    reader.readAsText(file);
    this.value = null;
}

// Send Deck to database
function send_deck() {
    var errors = deck.validate();
    if (errors.length == 0)
        BootstrapDialog.confirm({
            title: 'Send Deck',
            message: 'Are you sure you wish to send the current deck to BioBot?',
            type: BootstrapDialog.TYPE_INFO,
            btnOKLabel: 'Confirm',
            callback: function(result){
                if(result) {
                    var content = btoa(JSON.stringify(deck.getValue()));
                    window.location.assign(window.location.href + '/send/' + content);
                }
            }
        });
    else
        BootstrapDialog.alert({
            title: 'Error',
            message: 'Cannot send deck items that contain errors',
            type: BootstrapDialog.TYPE_DANGER
        });
}

var deck_holder = $("#deck_holder")[0];

// Initialize the deck editor
var deck = new JSONEditor(deck_holder, {schema: {$ref: "/get/schema/deck"}});

// Wait for editor to be ready (required because Ajax is used)
deck.on("ready",function() {
    deck.validate();
    $('.json-editor-btn-collapse').on("click", setHeightSidebar);
});

// Listen for changes, highlight errors if any
deck.on("change", function() {
    setHeightSidebar();
    var errors = deck.validate();
    var rows = deck.root.rows;
    var tmp;

    for (var i = 0; i < rows.length; i++)
        rows[i].tab.style.color = "";

    for (var i = 0; i < errors.length; i++) {
        tmp = errors[i].path.split('.');
        if (tmp.length > 1)
            rows[parseInt(tmp[1])].tab.style.color = "red";
    }
});

