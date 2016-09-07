#!/usr/bin/python
# -*- coding: utf-8 -*-

import argparse
from flask import Flask
from flask import Markup
from flask import redirect
from flask import render_template
from flask import request
from flask import url_for

default_host = "0.0.0.0"
default_port = "5000"
default_debug = False

# Help strings
help_host = "Hostname of the Flask app. Default: {0}".format(default_host)
help_port = "Port of the Flask app. Default: {0}".format(default_port)
help_debug = "Start Flask app in debug mode. Default: {0}".format(default_debug)

# Set up the command-line arguments
parser = argparse.ArgumentParser(description='BioBot Website Application')
parser.add_argument("-H", "--host", help=help_host, default=default_host)
parser.add_argument("-P", "--port", help=help_port, default=default_port)
parser.add_argument("-D", "--debug", dest="debug", action='store_true', help=help_debug)
parser.set_defaults(debug=default_debug)

args = parser.parse_args()

app = Flask(__name__)

@app.route('/')
def go_home():
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template('index.html')

@app.errorhandler(404)
def page_not_found(error):
    return render_template('404.html'), 404

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

if __name__ == '__main__':
    app.run(debug=args.debug, host=args.host, port=int(args.port))

