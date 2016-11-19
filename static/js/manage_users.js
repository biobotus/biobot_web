function activate_user(user) {
    BootstrapDialog.confirm({
        title: 'Activate user?',
        message: 'Are you sure you wish to activate user account ' + user + '?',
        type: BootstrapDialog.TYPE_INFO,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/activate/' + user);
        }
    });
}

function promote_user(user) {
    BootstrapDialog.confirm({
        title: 'Promote user?',
        message: 'Are you sure you wish to promote ' + user + ' to administrator?',
        type: BootstrapDialog.TYPE_SUCCESS,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/promote/' + user);
        }
    });
}

function revert_user(user) {
    BootstrapDialog.confirm({
        title: 'Revert user?',
        message: 'Are you sure you wish to revert ' + user + ' to standard user?',
        type: BootstrapDialog.TYPE_WARNING,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/demote/' + user);
        }
    });
}

function delete_user(user) {
    BootstrapDialog.confirm({
        title: 'Delete user?',
        message: 'Are you sure you wish to delete user ' + user + '?',
        type: BootstrapDialog.TYPE_DANGER,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result)
                window.location.assign(window.location.href + '/delete/' + user);
        }
    });
}
