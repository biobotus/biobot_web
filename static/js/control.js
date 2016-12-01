var listener;
var new_step;
var new_step_rel;
var sections = ['axis', 'sp', 'mp', 'gripper', 'tac'];
var visible_section = 'axis';
var axis_mode = 'Relative Movement';
var z_mode = 'Single Pipette';
var z_ids = {'Single Pipette': 0, 'Multiple Pipette': 1, 'Gripper': 2};
var tac_calib_cb = false;

// Variables used to display current position
var cur_pos_ids = ['cur_x_mm', 'cur_y_mm', 'cur_z0_mm',
                   'cur_z1_mm', 'cur_z2_mm', 'cur_sp_ul',
                   'cur_mp_ul', 'cur_g_wr', 'cur_g_op'];
var not_available = 'N/A';
var cur_x_mm_str  = not_available;
var cur_y_mm_str  = not_available;
var cur_z0_mm_str = not_available;
var cur_z1_mm_str = not_available;
var cur_z2_mm_str = not_available;
var cur_sp_ul_str = not_available;
var cur_mp_ul_str = not_available;
var cur_g_wr_str = not_available;
var cur_g_op_str = not_available;

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

    if (section == 'tac') {
        $('.platform').hide();
        $('.module').show();
    } else {
        $('.platform').show();
        $('.module').hide();
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
                print_warning('Absolute position only works with Single Pipette and requires positive values in mm.');
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
        var input_volume = $('#input-volume-mp')[0];
        var input_speed = $('#input-speed-mp')[0];

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

        var step_dict = {'module_type': 'pipette_m', 'params': {'name': 'manip', 'args': {'vol': volume, 'speed': speed}}}

        console.log(JSON.stringify(step_dict));

        var new_step_mp = new ROSLIB.Message({
            data : JSON.stringify(step_dict)
        });

        new_step.publish(new_step_mp);

    } else if (visible_section == 'gripper') {
        // Move Gripper

        var angle_dict = {};

        var input_m0 = $('#input-gripper-wrist')[0];
        var input_op = $('#input-gripper-opening')[0];

        if (!$.isNumeric(input_m0.value)) {
            input_m0.value = '';
        } else {
            var input_m0_val = parseFloat(input_m0.value);
            if (input_m0_val < -90) {
                input_m0_val = -90;
            } else if (input_m0_val > 90) {
                input_m0_val = 90;
            }
            input_m0.value = input_m0_val;
            angle_dict['wrist'] = input_m0_val;
        }

        if (!$.isNumeric(input_op.value)) {
            input_op.value = '';
        } else {
            var input_op_val = parseFloat(input_op.value);
            if (input_op_val < 0) {
                input_op_val = 0;
            } else if (input_op_val > 100) {
                input_op_val = 100;
            }
            input_op.value = input_op_val;
            angle_dict['opening'] = input_op_val;
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

function send_tac(action) {
    var params;

    if (action == 'config') {
        // Send Parameters to TAC
        var input_temp  = $('#input-tac-temp')[0];
        var input_turb  = $('#input-tac-turb')[0];
        var input_rate  = $('#input-tac-rate')[0];
        var input_motor = $('#input-tac-motor')[0];

        var temp_val = input_temp.value;
        var turb_val = input_turb.value;
        var rate_val = input_rate.value;
        var motor_val = input_motor.value;

        if (!$.isNumeric(temp_val) || !$.isNumeric(turb_val) || !$.isNumeric(rate_val) || !$.isNumeric(motor_val)) {
            print_warning('TAC Parameter require numeric inputs.');
            return
        }

        temp_val = parseFloat(temp_val)
        turb_val = parseFloat(turb_val)
        rate_val = parseFloat(rate_val)
        motor_val = parseFloat(motor_val)

        if (temp_val < 2 || temp_val > 55 || turb_val < 0 || turb_val > 100 || rate_val < 0.1 || rate_val > 10 || motor_val < 0 || motor_val > 100) {
            print_warning('At least one TAC parameter is out of limits.');
            return
        }

        params = {'target_temperature': temp_val, 'target_turbidity': turb_val, 'refresh_rate': rate_val, 'motor_speed': motor_val};

    } else if (action.startsWith('calibration')) {
        params = parseInt(action.split('_')[1])
        if (tac_calib_cb) {
            tac_calib_cb = false;
            action = 'calibration';
        } else {
            var msg;
            if (params == 100)
                msg = 'Place the transparent item (turbidity 100%) in the TAC and press \'Confirm\'.';
            else if (params == 0)
                msg = 'Place the opaque item (turbidity 0%) in the TAC and press \'Confirm\'.';

            BootstrapDialog.confirm({
                title: 'TAC Calibration',
                message: msg,
                type: BootstrapDialog.TYPE_PRIMARY,
                btnOKLabel: 'Confirm',
                callback: function(result){
                    if(result) {
                        tac_calib_cb = true;
                        send_tac(action);
                    }
                }
            });

            return;
        }
    } else if (action == 'start') {
        params = true;
    } else if (action == 'stop') {
        action = 'start';
        params = false;
    } else {
        print_warning('Invalid TAC action received.');
        return;
    }

    var message = {'action': action, 'params': params, 'use_db': false};

    var tac_msg = new ROSLIB.Message({
        data : JSON.stringify(message)
    });

    console.log(tac_msg.data);

    tac_topic.publish(tac_msg);
    return;
}

function receive_tac(message) {
    if (message['action'] == 'calibration_result') {
        if ('turb_0' in message['params']) {
            $('#cur_turb_0')[0].innerHTML = message['params']['turb_0'];
            send_tac('calibration_100');
        } else if ('turb_100' in message['params']) {
            $('#cur_turb_100')[0].innerHTML = message['params']['turb_100'];
            $('#start-tac').show();
        } else {
            print_warning('Invalid calibration result received: ' + message['params']);
        }
    } else if (message['action'] == 'actual_values') {
        var values = message['params'];
        $('#tac-param-temp')[0].innerHTML = values['target_temperature'] + '&ordm;C';
        $('#tac-param-turb')[0].innerHTML = values['target_turbidity'] + '%';
        $('#tac-param-rate')[0].innerHTML = values['refresh_rate'] + 's';
        $('#tac-param-motor')[0].innerHTML = values['motor_speed'] + '%';
        $('#cur_turb_0')[0].innerHTML = values['turb_0'];
        $('#cur_turb_100')[0].innerHTML = values['turb_100'];
        $('#cur_tac_temp')[0].innerHTML = values['actual_temperature'] + '&ordm;C';
        $('#cur_tac_turb')[0].innerHTML = values['actual_turbidity'] + '%';
        $('#start-tac').show();
    } else {
        print_warning('Invalid TAC message received: ' + message);
    }
}

function print_warning(message) {
    BootstrapDialog.alert({
        title: 'Error',
        message: message,
        type: BootstrapDialog.TYPE_DANGER
    });
}

window.onload = function() {
    $('.module').hide();
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

    tac_topic = new ROSLIB.Topic({
        ros : ros,
        name : '/BioBot_To_TAC1',
        messageType : 'std_msgs/String'
    });

    listener_tac = new ROSLIB.Topic({
      ros : ros,
      name : '/TAC1_To_BioBot',
      messageType : 'std_msgs/String'
    });

    listener_tac.subscribe(function(message) {
        receive_tac(JSON.parse(message.data));
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
    var step_dict = {'module_type': 'gripper', 'params': {'name': 'manip', 'args': {'wrist': 90, 'opening': 0}}}

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
    cur_mp_ul_str = data[6].toFixed(3).toString() + ul;
    cur_g_wr_str = data[7].toFixed(3).toString() + ' &ordm;';
    cur_g_op_str = data[8].toFixed(3).toString() + ' %';

    update_position();
}
