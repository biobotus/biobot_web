# BioBot Web Application

The web page is built with a combination of popular Open Source tools : [Python Flask], [Roslibjs], [Bootstrap], [DataTables], [MongoDB] and [MJPG-Streamer].

![BioBot Home Page](/static/img/home_page.png "BioBot Home Page")

It should run from the Jetson TK1 device. To start: `$ ./start_web.sh`. Then, from any browser on the network, navigate to URL `<Jetson TK1's IP address>:5000`. Here are the complete usage options:

```
$ ./start_web.sh --help
usage: biobot_web.py [-h] [-H HOST] [-P PORT] [-D]

BioBot Website Application

All information can be found at https://github.com/biobotus.
Modify file 'config.json' to edit the application's configuration.
There are other command line arguments that can be used:

optional arguments:
  -h, --help            show this help message and exit
  -H HOST, --host HOST  Hostname of the Flask app. Default: 0.0.0.0
  -P PORT, --port PORT  Port of the Flask app. Default: 5000
  -D, --debug           Start Flask app in debug mode. Default: False
```

## Quick User Guide
| Page | Description |
| ---- | ----------- |
| Login | Log in to the web application. Creating account and changing password features are implemented. |
| Surveillance | Display live stream video of the robot, which comes from the webcam. |
| Manual Control* | Manually control BioBot : Axis, Single Pipette, Multiple Pipette and Gripper. The current position of the robot refreshes automatically after every step. |
| Biological Protocol* | Create, modify, open or save deck and protocol files, as well as sending them to the Planner ROS node.
| Manage Users** | View all users, last login time and admin status. Can change admin status of users and delete them. |
&ast; Requires login  
&ast;&ast;Requires administrator rights

[Python Flask]: <http://flask.pocoo.org/>
[Roslibjs]: <http://wiki.ros.org/roslibjs>
[Bootstrap]: <http://getbootstrap.com/>
[DataTables]: <https://datatables.net/>
[MongoDB]: <https://www.mongodb.com/>
[MJPG-Streamer]: <https://sourceforge.net/projects/mjpg-streamer/>


