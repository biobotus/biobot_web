#!/usr/local/bin/python3
# -*- coding: utf-8 -*-

import argparse
import datetime
from flask import Flask, Markup, Response, abort, flash, redirect, \
                  render_template, request, url_for
from flask_login import LoginManager, UserMixin, current_user, login_required, \
                        login_user, logout_user
from functools import wraps
import json
import hashlib
import pandas
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

def admin_required(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin():
            return redirect(url_for('bad_permissions'))
        return func(*args, **kwargs)
    return decorated_function

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
biobot = client['biobot']

# Create Flask Application
app = Flask(__name__)
app.secret_key = uuid.uuid4().hex
login_manager = LoginManager()
login_manager.init_app(app)

# User class
class User(UserMixin):
    def __init__(self, username):
        self.username = username
        user = biobot.credentials.find_one({'username': username})
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
        user = biobot.credentials.find_one({'username': username})
        if user and check_password(user['password'], password):
            login_user(User(username))
            biobot.credentials.update_one(user, {'$set':
                                          {'last_login' : time.time()}})
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

@app.route('/create_account', methods=['GET', 'POST'])
def create_account():
    if request.method == 'POST':
        next = request.args.get('next')
        username = request.form['username']
        password = request.form['password']
        password_confirm = request.form['password_confirm']

        if not password:
            flash('Password cannot be empty', 'danger')
            return render_template('create_account.html')

        if password != password_confirm:
            flash('Both password entries do not match', 'danger')
            return render_template('create_account.html')

        if not username.replace('_', '').isalnum():
            flash('Invalid username (letters, numbers and underscores only)', 'danger')
            return render_template('create_account.html')

        user = biobot.credentials.find_one({'username': username})
        if user or not username:
            flash('Username not available', 'danger')
            return render_template('create_account.html')

        biobot.credentials.insert_one({'username': username,
                                     'password': hash_password(password),
                                     'admin': False})
        flash('Account created successfully', 'success')
        return redirect(url_for('login'))

    else:
        return render_template('create_account.html')

@app.route('/change_password', methods=['GET', 'POST'])
def change_password():
    if request.method == 'POST':
        username = request.form['username']
        old_password = request.form['old_password']
        new_password = request.form['new_password']

        user = biobot.credentials.find_one({'username': username})
        if user and check_password(user['password'], old_password):
            if not new_password:
                flash('Password cannot be empty', 'danger')
                return render_template('change_password.html')

            biobot.credentials.update_one(user, {'$set': {
                                          'password': hash_password(new_password)}})
            flash('Password changed successfully', 'success')
            return redirect(url_for('login'))

        else:
            flash('Invalid credentials', 'danger')
            return render_template('change_password.html')

    else:
        return render_template('change_password.html')

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

@app.route('/manage_users')
@login_required
@admin_required
def manage_users():
    user_list = list(biobot.credentials.find())
    return render_template('manage_users.html', users=user_list)

@app.route('/manage_users/demote/<username>')
@login_required
@admin_required
def demote_user(username):
    biobot.credentials.update_one({'username': username}, {'$set': {'admin': False}})
    flash("User {0} reverted to standard user successfully".format(username), 'info')
    return redirect(url_for('manage_users'))

@app.route('/manage_users/promote/<username>')
@login_required
@admin_required
def promote_user(username):
    biobot.credentials.update_one({'username': username}, {'$set': {'admin': True}})
    flash("User {0} promoted to administrator successfully".format(username), 'info')
    return redirect(url_for('manage_users'))

@app.route('/manage_users/delete/<username>')
@login_required
@admin_required
def delete_user(username):
    if current_user.get_id() == username:
        flash('Cannot delete yourself', 'danger')
    else:
        biobot.credentials.delete_one({'username': username})
        flash("User {0} deleted successfully".format(username), 'info')
    return redirect(url_for('manage_users'))

@app.route('/bad_permissions')
def bad_permissions():
    return render_template('bad_permissions.html')

@app.errorhandler(404)
def page_not_found(error):
    """This method handles all unexisting route requests"""
    return render_template('404.html'), 404

# Add methods that can be called from the Jinja2 HTML templates
def convert_ts(ts):
    """Convert timestamp to human-readable string"""
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')

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

app.jinja_env.globals.update(format_sidebar=format_sidebar, convert_ts=convert_ts)

# Start the application
if __name__ == '__main__':
    app.run(debug=conf.debug, host=conf.host, port=int(conf.port))

