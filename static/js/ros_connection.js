var ros;
var global_enable_topic;
var step_done_topic;
var error_topic;
var ros_connection_error = false;

function update_status(msg) {
    document.getElementById('biobot_status').innerHTML = msg;
    if (msg.startsWith('powered off')) {
        document.getElementById('pause').style.display = 'none';
        document.getElementById('resume').style.display = 'none';
    } else if (msg.startsWith('paused')) {
        document.getElementById('pause').style.display = 'none';
        document.getElementById('resume').style.display = 'inline';
    } else {
        document.getElementById('pause').style.display = 'inline';
        document.getElementById('resume').style.display = 'none';
    }
}

function ros_init() {
    // Connecting to ROS
    ros = new ROSLIB.Ros();

    // If there is an error on the backend, an 'error' emit will be emitted.
    ros.on('error', function(error) {
        console.log(error);
        ros_connection_error = true;
        document.getElementById('ros_label_connecting').style.display = 'none';
        document.getElementById('ros_label_connected').style.display = 'none';
        document.getElementById('ros_label_closed').style.display = 'none';
        document.getElementById('ros_label_error').style.display = 'inline';
        update_status('powered off');
    });

    // Find out exactly when we made a connection.
    ros.on('connection', function() {
        console.log('Connection made!');
        ros_connection_error = false;
        document.getElementById('ros_label_connecting').style.display = 'none';
        document.getElementById('ros_label_connected').style.display = 'inline';
        document.getElementById('ros_label_closed').style.display = 'none';
        document.getElementById('ros_label_error').style.display = 'none';
        update_status('connected');
    });

    ros.on('close', function() {
        console.log('Connection closed.');
        document.getElementById('ros_label_connecting').style.display = 'none';
        document.getElementById('ros_label_connected').style.display = 'none';
        document.getElementById('ros_label_closed').style.display = 'none';
        document.getElementById('ros_label_error').style.display = 'none';
        update_status('powered off');

        if (ros_connection_error) {
            document.getElementById('ros_label_error').style.display = 'inline';
        } else {
            document.getElementById('ros_label_closed').style.display = 'inline';
        }
    });

    ros.connect('ws://' + ros_host + ':' + ros_port);

    add_global_topic()
}

function e_stop_send() {
    BootstrapDialog.confirm({
        title: 'Emergency stop!',
        message: 'Cancel all BioBot activities immediately? It will require a manual restart.',
        type: BootstrapDialog.TYPE_DANGER,
        btnOKLabel: 'Confirm',
        callback: function(result){
            if(result) {
                var global_disable = new ROSLIB.Message({
                    data: false
                });
                global_enable_topic.publish(global_disable);
                console.log("Publishing e-stop")

                var error = new ROSLIB.Message({
                    data: JSON.stringify({"error_code": "Sw0", "name": "BioBot_Web"})
                });

                error_topic.publish(error)
            }
        }
    });
}

function pause(action) {
    var message = new ROSLIB.Message({
        data: action
    });

    pause_topic.publish(message)
}

function add_global_topic() {
    global_enable_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Global_Enable',
        messageType: 'std_msgs/Bool'
    });

    step_done_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Step_Done',
        messageType: 'std_msgs/Bool'
    });

    error_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Error',
        messageType: 'std_msgs/String'
    });

    pause_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/Pause',
        messageType: 'std_msgs/Bool'
    });

    status_topic = new ROSLIB.Topic({
        ros: ros,
        name: '/BioBot_Status',
        messageType: 'std_msgs/String'
    });

    step_done_topic.subscribe(function(message) {
        if (!message.data)
            BootstrapDialog.show({
                title: 'Error',
                message: 'BioBot requires a manual restart.',
                type: BootstrapDialog.TYPE_DANGER
            });
    });

    status_topic.subscribe(function(message) {
        update_status(message.data);
    });
}

window.onload = function() {
    setHeightSidebar();
    ros_init();
};

