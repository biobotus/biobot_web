var listener;
var new_step_rel;

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

    new_step_rel.publish(rel_step)
    return;
}

window.onload = function() {
    setHeightSidebar();
    ros_init();
    add_topic();
}

window.onbeforeunload = function(){
    listener.unsubscribe()
}

function add_topic() {
    new_step_rel = new ROSLIB.Topic({
        ros : ros,
        name : '/New_Step_Rel',
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

function new_position (data) {
    $('#valid_x')[0].value = data[0].toFixed(3);
    $('#valid_y')[0].value = data[1].toFixed(3);
    $('#valid_z')[0].value = data[2].toFixed(3);
}

