// JavaScript file used in deck item validation page

var listener;
var new_step;
var new_step_rel;

// Relative movements function (called from buttons)
function move(axis, dist) {
    var args;

    if (axis == 'X')
        args = {'x': dist, 'y': 0, 'z': 0}
    else if (axis == 'Y')
        args = {'x': 0, 'y': dist, 'z': 0}
    else if (axis == 'Z')
        args = {'x': 0, 'y': 0, 'z': dist}
    else
        return

    var rel_dict = {'params': {'args': args, 'name': 'pos'}, 'module_type': 'pipette_s'};
    console.log(JSON.stringify(rel_dict));

    var rel_step = new ROSLIB.Message({
        data : JSON.stringify(rel_dict)
    });

    new_step_rel.publish(rel_step);
    return;
}

// Safely move the robot to absolute coordinates, by making it always reach z = 0 first
function move_abs(x, y, z) {
    move_abs_safe(x, y, 0);
    move_abs_safe(x, y, z);
}

// Send absolute coordinates to the robot
function move_abs_safe(x, y, z) {
    var abs_dict = {'params': {'args': {'x': x, 'y': y, 'z': z}, 'name': 'pos'}, 'module_type': 'pipette_s'};
    console.log(JSON.stringify(abs_dict));

    var abs_step = new ROSLIB.Message({
        data : JSON.stringify(abs_dict)
    });

    new_step.publish(abs_step);
}

window.onload = function() {
    setHeightSidebar();
    ros_init();
    add_topic();
}

window.onbeforeunload = function(){
    listener.unsubscribe()
}

// ROS topics related to the current page
function add_topic() {
    new_step_rel = new ROSLIB.Topic({
        ros : ros,
        name : '/New_Step_Rel',
        messageType : 'std_msgs/String'
    });

    new_step = new ROSLIB.Topic({
        ros : ros,
        name : '/New_Step',
        messageType : 'std_msgs/String'
    });

    listener = new ROSLIB.Topic({
      ros : ros,
      name : '/Refresh_Pos',
      messageType : 'biobot_ros_msgs/FloatList'
    });

    listener.subscribe(function(message) {
        console.log('New position received: ' + message.data);
        new_position(message.data)
    });
}

// Update current coordinates when a new position is received
function new_position (data) {
    $('#valid_x')[0].value = data[0].toFixed(3);
    $('#valid_y')[0].value = data[1].toFixed(3);
    $('#valid_z')[0].value = data[2].toFixed(3);
}

