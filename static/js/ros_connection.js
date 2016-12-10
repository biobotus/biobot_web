// JS file to connect to ROS

var ros;
var global_enable_topic;
var step_done_topic;
var error_topic;
var ros_connection_error = false;

// Display the current status of the robot at bottom center of the page
function update_status(msg) {
    $('#biobot_status')[0].innerHTML = msg;
    if (msg.startsWith('powered off')) {
        $('#pause').hide()
        $('#resume').hide()
    } else if (msg.endsWith('(paused)')) {
        $('#pause').hide()
        $('#resume').show()
    } else {
        $('#pause').show()
        $('#resume').hide()
    }
}

// Create ROS object and connect to the rosbridge server via websocket
function ros_init() {
    // Connecting to ROS
    ros = new ROSLIB.Ros();

    // If there is an error on the backend, an 'error' emit will be emitted.
    ros.on('error', function(error) {
        console.log(error);
        ros_connection_error = true;
        $('#ros_label_connecting').hide()
        $('#ros_label_connected').hide()
        $('#ros_label_closed').hide()
        $('#ros_label_error').show()
        update_status('powered off');
    });

    // Find out exactly when we made a connection.
    ros.on('connection', function() {
        console.log('Connection made!');
        ros_connection_error = false;
        $('#ros_label_connecting').hide()
        $('#ros_label_connected').show()
        $('#ros_label_closed').hide()
        $('#ros_label_error').hide()
        update_status('connected');
    });

    ros.on('close', function() {
        console.log('Connection closed.');
        $('#ros_label_connecting').hide()
        $('#ros_label_connected').hide()
        $('#ros_label_closed').hide()
        $('#ros_label_error').hide()
        update_status('powered off');

        if (ros_connection_error) {
            $('#ros_label_error').show()
        } else {
            $('#ros_label_closed').show()
        }
    });

    ros.connect('ws://' + ros_host + ':' + ros_port);

    add_global_topic();
}

// Send emergency stop to the robot - this will kill ROS
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

// Manually pause the robot at the Planner level (Manual Control actions will still go through)
function pause(action) {
    var message = new ROSLIB.Message({
        data: action
    });

    pause_topic.publish(message)
}

// ROS topics used in every page
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

