function validate_item(uuid) {
    window.location.assign(window.location.href + '/validate/' + uuid)
}

function delete_item(item, uuid) {
    BootstrapDialog.confirm({
        title: 'Delete item?',
        message: 'Are you sure you wish to delete deck item ' + item + '?',
        type: BootstrapDialog.TYPE_DANGER,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/delete/' + uuid);
        }
    });
}

function modify_item(item, uuid) {
    BootstrapDialog.confirm({
        title: 'Modify item?',
        message: 'Are you sure you wish to modify deck item ' + item + '?<br>This will place it back in the \'to validate\' list.',
        type: BootstrapDialog.TYPE_WARNING,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/modify/' + uuid);
        }
    });
}

