// Dialog confirmation windows used in ROS Status admin page, to start or kill ROS

function start_ros(){
    BootstrapDialog.confirm({
        title: 'Start ROS?',
        message: 'Really start ROS?',
        type: BootstrapDialog.TYPE_SUCCESS,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result) {
                window.location.assign('/ros_start');
            }
        }
    });
}

function stop_ros(){
    BootstrapDialog.confirm({
        title: 'Stop ROS?',
        message: 'Are you sure you wish to stop ROS?',
        type: BootstrapDialog.TYPE_DANGER,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result) {
                window.location.assign('/ros_stop');
            }
        }
    });
}

