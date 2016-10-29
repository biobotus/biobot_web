function delete_log(protocol) {
    BootstrapDialog.confirm({
        title: 'Delete log entry?',
        message: 'Are you sure you wish to delete log ' + protocol + '?',
        type: BootstrapDialog.TYPE_DANGER,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/delete/' + protocol);
        }
    });
}
