# BioBot Web Application

The BioBot Web Application is used by scientists to operate the robot. It combines a client (web browser of any computer or tablet on the BioBot network), a Flask based server and a MongoDB database instance, both running on the BioBot's [Jetson TK1] device. The application unifies the following Open Source tools to form a user-friendly application:
- [Python Flask] as the web server,
- [Roslibjs] to communicate with other ROS nodes of the robot,
- [Bootstrap] as the main user interface framework,
- [DataTables] to improve the display of various data,
- [MongoDB] as the database,
- [MJPG-Streamer] to enable live-streaming a video of the robot from its webcam,
- [JSON Editor] to graphically create biological protocol files following the [Autoprotocol] open standard,
- [D3], to create graphs to display realtime TAC values.

The development guide for the web application is a OneNote document located in the 'doc' folder.

![BioBot Home Page](/static/img/home_page.png "BioBot Home Page")

To start, run this command from the `biobot_web` repository on the Jetson TK1: `$ ./start_web.sh`. Then, from any browser on the network, navigate to URL `<Jetson TK1's IP address>:5000`. Here are the complete usage options:

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
| Manual Control* | Manually control BioBot : Axis, Single Pipette, Multiple Pipette, Gripper, TAC Module and General settings. The current position of the robot refreshes automatically after every step. |
| Mapping* | Visualize labware on the platform and validate its location using the single-channel pipette's tip as reference. Validated items can be used by the robot for the execution of protocols. |
| Biological Protocol* | Graphically create and modify biological protocols. They can be saved for later, loaded whenever and executed on the platform. |
| Deck Editor* | Manually tell the BioBot the approximate location of items on the deck of the platform. Deck description files can be saved and loaded at any time. This is the manual equivalent of the 3D cartography. |
| Logs | View details and results about every executed biological protocols. The informations contain a description of every step, including start and stop timestamps, as well as bacterial colony analysis, if any. Only administrators can delete protocol logs. |
| Manage Users** | View all users, last login time and admin status. Can change admin status of users and delete them. |
| Manage Labware** | View, add and remove labware items, used in the Protocol Editor's labware section as well as in the item validation feature of the Mapping tab. |
| ROS Status** | Start or kill ROS (All scripts used to operate the robot). |
&ast; Requires login  
&ast;&ast;Requires administrator rights

[Jetson TK1]: <http://www.nvidia.com/object/jetson-tk1-embedded-dev-kit.html>
[Python Flask]: <http://flask.pocoo.org>
[Roslibjs]: <http://wiki.ros.org/roslibjs>
[Bootstrap]: <http://getbootstrap.com>
[DataTables]: <https://datatables.net>
[MongoDB]: <https://www.mongodb.com>
[MJPG-Streamer]: <https://sourceforge.net/projects/mjpg-streamer>
[JSON Editor]: <https://github.com/jdorn/json-editor>
[Autoprotocol]: <http://autoprotocol.org/>
[D3]: <https://d3js.org/>

