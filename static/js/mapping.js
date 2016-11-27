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

function start_3d_cartography() {
    BootstrapDialog.confirm({
        title: 'Start 3D Cartography?',
        message: 'Are you sure you wish to initiate the automated process of identifying objects on the deck?<br>This may take some time.',
        type: BootstrapDialog.TYPE_PRIMARY,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result) {
                var mapping_msg = new ROSLIB.Message({
                    data: true
                });

                start_mapping.publish(mapping_msg);
            }
        }
    });
}

function add_topic() {
    start_mapping = new ROSLIB.Topic({
        ros: ros,
        name: '/Start_Mapping',
        messageType: 'std_msgs/Bool'
    });
}

window.onload = function() {
    setHeightSidebar();
    ros_init();
    add_topic();
}
