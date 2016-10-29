function delete_item(item) {
    BootstrapDialog.confirm({
        title: 'Delete item?',
        message: 'Are you sure you wish to delete item ' + item + '?',
        type: BootstrapDialog.TYPE_DANGER,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/delete/' + item);
        }
    });
}
