# BioBot Web Application

The web page is built with a combination of popular Open Source tools : [Python Flask], [Bootstrap] and [DataTables]. It is planned to include [MongoDB] in the short term future.

![BioBot Home Page](/static/img/home_page.png "BioBot Home Page")

The webcam showing real-time video of the robot in tab `Surveillance` is using [MJPG-Streamer].

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

[Python Flask]: <http://flask.pocoo.org/>
[Bootstrap]: <http://getbootstrap.com/>
[DataTables]: <https://datatables.net/>
[MongoDB]: <https://www.mongodb.com/>
[MJPG-Streamer]: <https://sourceforge.net/projects/mjpg-streamer/>

