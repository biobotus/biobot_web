#!/usr/local/bin/python3
# -*- coding: utf-8 -*-

import argparse
from flask import Flask, Markup, Response, abort, flash, redirect, \
                  render_template, request, url_for
from flask_login import LoginManager, UserMixin, login_required, login_user, \
                        logout_user
import json
import hashlib
import pymongo
import time
import uuid

def hash_password(password):
    """This function hashes the password with SHA256 and a random salt"""
    salt = uuid.uuid4().hex
    return hashlib.sha256(salt.encode() + password.encode()).hexdigest() + ':' + salt

def check_password(hashed_password, user_password):
    """This function checks a password against a SHA256:salt entry"""
    password, salt = hashed_password.split(':')
    return password == hashlib.sha256(salt.encode() + user_password.encode()).hexdigest()

def convert_ts(ts):
    """Convert timestamp to human-readable string"""
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

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
parser.add_argument('-H', '--host', help=help_host, default=conf.host)
parser.add_argument('-P', '--port', help=help_port, default=conf.port)
parser.add_argument('-D', '--debug', dest='debug', action='store_true', help=help_debug)
parser.set_defaults(debug=conf.debug)

# Update default configs with command line args
args = parser.parse_args()
conf.__dict__.update(args.__dict__)

# Get MongoDB Database Client
client = pymongo.MongoClient("{0}:{1}".format(conf.db_host, conf.db_port))
users = client['users']

# Create Flask Application
app = Flask(__name__)
app.secret_key = uuid.uuid4().hex
login_manager = LoginManager()
login_manager.init_app(app)

# User class
class User(UserMixin):
    def __init__(self, username):
        self.username = username
        user = users.credentials.find_one({'username': username})
        self.admin = user['admin']

    def get_id(self):
        return self.username

    def is_admin(self):
        return self.admin

# Login Manager Configuration
@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

@login_manager.unauthorized_handler
def unauthorized_callback():
    return redirect('/login?next=' + request.path)

# Application routes
@app.route('/')
def go_home():
    return redirect(url_for('home'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        next = request.args.get('next')
        username = request.form['username']
        password = request.form['password']
        user = users.credentials.find_one({'username': username})
        if user and check_password(user['password'], password):
            login_user(User(username))
            return redirect(next or url_for('home'))
        else:
            flash('Invalid credentials', 'danger')
            return render_template('login.html')

    else:
        return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/surveillance')
def surveillance():
    return render_template('surveillance.html', conf=conf)

@app.route('/control')
@login_required
def control():
    return render_template('control.html')

@app.route('/protocol')
@login_required
def protocol():
    return render_template('protocol.html')

@app.errorhandler(404)
def page_not_found(error):
    """This method handles all unexisting route requests"""
    return render_template('404.html'), 404

# Add methods that can be called from the Jinja2 HTML templates
def format_sidebar(name, icon, url):
    """
    Used to generate HTML line for sidebar in layout.html.
        - name is the name of the tab
        - icon is the glyphicon name
    """

    current_url = request.path.split('/')[1]
    active = ' class="active"' if url == current_url else ''
    html = '<li{0}><a href="/{1}"><i style="float:left; margin-right: 14px;"><span class="glyphicon glyphicon-{2}"></span></i>{3}</a></li>'.format(active, url, icon, name)

    return Markup(html)

app.jinja_env.globals.update(format_sidebar=format_sidebar)

# Start the application
if __name__ == '__main__':
    app.run(debug=conf.debug, host=conf.host, port=int(conf.port))

