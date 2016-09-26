#!/usr/bin/python3
# -*- coding: utf-8 -*-

import argparse
from flask import Flask
from flask import Markup
from flask import redirect
from flask import render_template
from flask import request
from flask import url_for
import json

# Load default configuration
with open('config.json') as config:
    conf = argparse.Namespace(**json.load(config))

# Argument parser strings
app_description = """BioBot Website Application

All information can be found at https://github.com/biobotus.
Modify file 'config.json' to edit the application's configuration.
There are other command line arguments that can be used:
"""

help_host = "Hostname of the Flask app. Default: {0}".format(conf.host)
help_port = "Port of the Flask app. Default: {0}".format(conf.port)
help_debug = "Start Flask app in debug mode. Default: {0}".format(conf.debug)

# Set up the command-line arguments
parser = argparse.ArgumentParser(description=app_description,
                                 formatter_class=argparse.RawTextHelpFormatter)
parser.add_argument("-H", "--host", help=help_host, default=conf.host)
parser.add_argument("-P", "--port", help=help_port, default=conf.port)
parser.add_argument("-D", "--debug", dest="debug", action='store_true', help=help_debug)
parser.set_defaults(debug=conf.debug)

# Update default configs with command line args
args = parser.parse_args()
conf.__dict__.update(args.__dict__)

# Create Flask Application object
app = Flask(__name__)

# Application routes
@app.route('/')
def go_home():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/surveillance')
def surveillance():
    return render_template('surveillance.html', conf=conf)

@app.route('/control')
def control():
    return render_template('control.html')

@app.route('/protocol')
def protocol():
    return render_template('protocol.html')

@app.errorhandler(404)
def page_not_found(error):
    """This method handles all unexisting route requests"""
    return render_template('404.html'), 404

# Add methods that can be called from the Jinja2 HTML templates
def format_sidebar(name, icon):
    """
    Used to generate HTML line for sidebar in layout.html.
        - name is the name of the tab
        - icon is the glyphicon name
    """

    current_url = request.path.split('/')[1]
    url = name.lower().split()[-1]
    active = ' class="active"' if url == current_url else ''
    html = '<li{0}><a href="/{1}"><i style="float:left; margin-right: 14px;"><span class="glyphicon glyphicon-{2}"></span></i>{3}</a></li>'.format(active, url, icon, name)

    return Markup(html)

app.jinja_env.globals.update(format_sidebar=format_sidebar)

# Start the application
if __name__ == '__main__':
    app.run(debug=conf.debug, host=conf.host, port=int(conf.port))

