var listener;
var new_step;
var new_step_rel;
var sections = ['axis', 'sp', 'mp', 'gripper'];
var visible_section = 'axis';
var axis_mode = 'Relative Movement';
var z_mode = 'Simple Pipette';
var z_ids = {'Simple Pipette': 0, 'Multiple Pipette': 1, 'Gripper': 2};

// Variables used to display current position
var cur_pos_ids = ['cur_x_mm', 'cur_y_mm', 'cur_z0_mm',
                   'cur_z1_mm', 'cur_z2_mm', 'cur_sp_ul'];
var not_available = 'N/A';
var cur_x_mm_str  = not_available;
var cur_y_mm_str  = not_available;
var cur_z0_mm_str = not_available;
var cur_z1_mm_str = not_available;
var cur_z2_mm_str = not_available;
var cur_sp_ul_str = not_available;

function show(section) {
    visible_section = section;
    var sec;

    for (i in sections) {
        sec = sections[i];
        if (sec == section) {
            $('#show-'+sec+'-btn').addClass('active');
            $('#'+sec+'-control').show();
        } else {
            $('#show-'+sec+'-btn').removeClass('active');
            $('#'+sec+'-control').hide();
        }
    }
}

function select(dropdown, option) {
    // Update JavaScript variable
    window[dropdown] = option;

    // Change displayed text on dropdown menu
    $('#'+dropdown).html(option+' <span class="caret"></span>');
}

function move() {
    if (visible_section == 'axis') {
        // Move Axis
        var input_x  = $('#input-x')[0];
        var input_y  = $('#input-y')[0];
        var input_z  = $('#input-z')[0];
        var z_id = z_ids[z_mode];

        var x_step = input_x.value;
        var y_step = input_y.value;
        var z_step = input_z.value;

        if (axis_mode == 'Relative Movement') {
            if (!$.isNumeric(x_step)) {
                x_step = 0;
                input_x.value = x_step;
            } else {
                x_step = parseFloat(x_step);
            }
            if (!$.isNumeric(y_step)) {
                y_step = 0;
                input_y.value = y_step;
            } else {
                y_step = parseFloat(y_step);
            }
            if (!$.isNumeric(z_step)) {
                z_step = 0;
                input_z.value = z_step;
            } else {
                z_step = parseFloat(z_step);
            }

            var rel_dict = {'params': {'name': 'pos', 'args': {'x': x_step, 'y': y_step, 'z': z_step}}}

            if (z_id == 0)
                rel_dict['module_type'] = 'pipette_s'
            else if (z_id == 1)
                rel_dict['module_type'] = 'pipette_m'
            else if (z_id == 2)
                rel_dict['module_type'] = 'gripper'

            console.log(JSON.stringify(rel_dict));

            var rel_step = new ROSLIB.Message({
                data : JSON.stringify(rel_dict)
            });

            new_step_rel.publish(rel_step)
            return;

        } else if (axis_mode == 'Absolute Position') {
            if (z_id != 0 || !$.isNumeric(x_step) || !$.isNumeric(y_step) || !$.isNumeric(z_step) || x_step < 0 || y_step < 0 || z_step < 0) {
                print_warning('Absolute position only works with Simple Pipette and requires positive values in mm.');
                return
            }

            x_step = parseFloat(x_step);
            y_step = parseFloat(y_step);
            z_step = parseFloat(z_step);

            var abs_dict = {'module_type': 'pipette_s', 'params': {'name': 'pos', 'args': {'x': x_step, 'y': y_step, 'z': z_step}}}

            console.log(JSON.stringify(abs_dict))

            var abs_step = new ROSLIB.Message({
                data : JSON.stringify(abs_dict)
            });

            new_step.publish(abs_step)
            return;
        }

    } else if (visible_section == 'sp') {
        // Move Single Pipette
        var input_volume = $('#input-volume-sp')[0];
        var input_speed = $('#input-speed-sp')[0];

        var volume = input_volume.value;
        var speed = input_speed.value;

        if (!$.isNumeric(volume)) {
            volume = 0;
            input_volume.value = volume;
        } else {
            volume = parseFloat(volume);
        }

        if (!$.isNumeric(speed) || speed <= 0) {
            input_speed.value = '';
            print_warning('Speed must be a number and greater than 0 µL/s.');
            return;
        } else {
            speed = parseFloat(speed);
        }

        var step_dict = {'module_type': 'pipette_s', 'params': {'name': 'manip', 'args': {'vol': volume, 'speed': speed}}}

        console.log(JSON.stringify(step_dict));

        var new_step_sp = new ROSLIB.Message({
            data : JSON.stringify(step_dict)
        });

        new_step.publish(new_step_sp);

    } else if (visible_section == 'mp') {
        // Move Multiple Pipette
        print_warning('Multiple Pipette move yet not implemented.');

    } else if (visible_section == 'gripper') {
        // Move Gripper

        var angle_dict = {};

        var input_m0 = $('#input-gripper-wrist')[0];
        var input_op = $('#input-gripper-opening')[0];
        var input_m0_val = input_m0.value;
        var input_op_val = input_op.value;

        if (!$.isNumeric(input_m0_val)) {
            input_m0.value = '';
        } else {
            if (input_m0_val < -90) {
                input_m0_val = -90;
            } else if (input_m0_val > 0) {
                input_m0_val = 0;
            }
            input_m0.value = input_m0_val;
            angle_dict[0] = parseFloat(input_m0_val);
        }

        if (!$.isNumeric(input_op_val)) {
            input_op.value = '';
        } else {
            if (input_op_val < 0) {
                input_op_val = 0;
            } else if (input_op_val > 100) {
                input_op_val = 100;
            }
            input_op.value = input_op_val;
            var input_m12 = 62*(1-input_op_val/100);
            angle_dict[1] = input_m12;
            angle_dict[2] = input_m12;
        }

        if (Object.keys(angle_dict).length != 0) {
            var step_dict = {'module_type': 'gripper', 'params': {'name': 'manip', 'args': angle_dict}}

            console.log(JSON.stringify(step_dict));

            var new_step_gripper = new ROSLIB.Message({
                data : JSON.stringify(step_dict)
            });

            new_step.publish(new_step_gripper);
        }
    }
}

function print_warning(message) {
    var div_warning  = $('#error-message')[0];
    div_warning.innerHTML = '<div class="alert alert-danger alert-dismissible fade in" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Error!</strong> '+message+'</div>'
}

window.onload = function() {
    setHeightSidebar();
    update_position();
    ros_init();
    add_topic();
}

window.onbeforeunload = function(){
    listener.unsubscribe()
}

function update_position() {
    cur_pos_ids.forEach(function(entry) {
        $('#'+entry)[0].innerHTML = window[entry+'_str'];
    });
}

function add_topic() {
    new_step = new ROSLIB.Topic({
        ros : ros,
        name : '/New_Step',
        messageType : 'std_msgs/String'
    });

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

function home(axis) {
    var axis_list = [];

    if (axis.indexOf('XY') >= 0)
        axis_list.push('MotorControlXY');
    if (axis.indexOf('Z') >= 0)
        axis_list.push('MotorControlZ');
    if (axis.indexOf('SP') >= 0)
        console.log('Init of SP not yet implemented');
    if (axis.indexOf('MP') >= 0)
        console.log('Init of MP not yet implemented');

    var step_init = {'module_type': 'init', 'params': axis_list};

    if (axis_list.length > 0) {
        var new_step_init = new ROSLIB.Message({
            data : JSON.stringify(step_init)
        });

        new_step.publish(new_step_init);
    }

    if (axis.indexOf('G') >= 0)
        home_gripper();
}

function home_gripper() {
    var step_dict = {'module_type': 'gripper', 'params': {'name': 'manip', 'args': {'0': -90, '1': 49.6, '2': 49.6}}}

    var new_step_gripper = new ROSLIB.Message({
        data : JSON.stringify(step_dict)
    });

        new_step.publish(new_step_gripper);
}

function new_position (data) {
    var mm = ' mm';
    var ul = ' µL';

    cur_x_mm_str  = data[0].toFixed(3).toString() + mm;
    cur_y_mm_str  = data[1].toFixed(3).toString() + mm;
    cur_z0_mm_str = data[2].toFixed(3).toString() + mm;
    cur_z1_mm_str = data[3].toFixed(3).toString() + mm;
    cur_z2_mm_str = data[4].toFixed(3).toString() + mm;
    cur_sp_ul_str = data[5].toFixed(3).toString() + ul;

    update_position();
}
