#!/usr/bin/python3
# -*- coding: utf-8 -*-

import argparse
import ast
import base64
from bson import ObjectId
import datetime
from flask import Flask, Markup, Response, abort, escape, flash, redirect, \
                  render_template, request, url_for
from flask_login import LoginManager, UserMixin, current_user, login_required, \
                        login_user, logout_user
from functools import wraps
from gridfs import GridFS
from jinja2 import evalcontextfilter
import json
import hashlib
import pandas as pd
import pymongo
import re
import time
import uuid

import biobot_schema

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

def valid_protocol(protocol):
    if protocol in client.database_names() and protocol.startswith('protocol'):
        return True
    else:
        flash("Protocol {0} does not exist".format(protocol), 'warning')
        return False

# Load default configuration
with open('config.json') as config:
    conf = argparse.Namespace(**json.load(config))

# Argument parser strings
app_description = "BioBot Website Application\n\n" \
        "All information can be found at https://github.com/biobotus.\n" \
        "Modify file 'config.json' to edit the application's configuration.\n" \
        "There are other command line arguments that can be used:"

help_host = "Hostname of the Flask app. Default: {0}".format(conf.app_host)
help_port = "Port of the Flask app. Default: {0}".format(conf.app_port)
help_debug = "Start Flask app in debug mode. Default: {0}".format(conf.debug)

# Set up the command-line arguments
parser = argparse.ArgumentParser(description=app_description,
                                 formatter_class=argparse.RawTextHelpFormatter)
parser.add_argument('-H', '--app_host', help=help_host, default=conf.app_host)
parser.add_argument('-P', '--app_port', help=help_port, default=conf.app_port)
parser.add_argument('-D', '--debug', dest='debug', action='store_true', help=help_debug)
parser.set_defaults(debug=conf.debug)

# Update default configs with command line args
args = parser.parse_args()
conf.__dict__.update(args.__dict__)

# Get MongoDB Database Client
client = pymongo.MongoClient()
biobot = client['biobot']

# Validate MongoDB is started, else exit
try:
    client.server_info()
except pymongo.errors.ServerSelectionTimeoutError:
    print('MongoDB is not started. Restart it before launching the web app again.')
    quit()

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
            if user.get('active', False):
                login_user(User(username))
                biobot.credentials.update_one(user, {'$set':
                                              {'last_login' : time.time()}})
                if user['admin'] and \
                   biobot.credentials.find_one({'active': {'$exists': False}}):
                    flash('At least one user account has to be activated', 'info')
                    return redirect(url_for('manage_users'))
                return redirect(next or url_for('home'))
            else:
                flash('Account not yet activated by an administrator', 'warning')
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
        username = request.form['username'].strip()
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
    return render_template('surveillance.html')

@app.route('/control')
@login_required
def control():
    return render_template('control.html')

@app.route('/protocol_editor')
@login_required
def protocol_editor():
    return render_template('protocol_editor.html')

@app.route('/deck_editor')
@login_required
def deck_editor():
    return render_template('deck_editor.html')

@app.route('/deck_editor/send/<b64_deck>')
@login_required
def receive_deck(b64_deck):
    deck = ast.literal_eval(base64.b64decode(b64_deck).decode('utf-8'))
    if deck:
        for i in range(len(deck)):
            deck[i]['source'] = 'deck_editor'
            deck[i]['uuid'] = uuid.uuid4().hex
        biobot.deck.insert_many(deck)
    return redirect(url_for('mapping'))

@app.route('/mapping')
@login_required
def mapping():
    from_editor = list(biobot.deck.find({'source': 'deck_editor',
                                         'validated': {'$exists': False}}))
    from_carto = list(biobot.deck.find({'source': '3d_cartography',
                                        'validated': {'$exists': False}}))
    validated = list(biobot.deck.find({'validated': True}))

    if from_editor or from_carto:
        flash('Some labware location has to be validated.', 'warning')
    elif len(validated) == 0:
        flash('No labware has been found.', 'danger')
    else:
        flash('All labware has been validated.', 'success')

    return render_template('mapping.html', from_editor=from_editor,
                           from_carto=from_carto, validated=validated)

@app.route('/mapping/delete/<uid>')
@login_required
def mapping_delete(uid):
    item = biobot.deck.find_one({'uuid': uid})
    if item:
        if item['source'] == '3d_cartography':
            fs = GridFS(biobot)
            fs.delete(item['image_id'])
        biobot.deck.delete_one(item)
    return redirect(url_for('mapping'))

@app.route('/mapping/modify/<uid>')
@login_required
def mapping_modify(uid):
    biobot.deck.update_one({'uuid': uid}, {'$unset': {'validated': ''}})
    return redirect(url_for('mapping'))

@app.route('/mapping/validate/<uid>', methods=['GET', 'POST'])
@login_required
def mapping_validate(uid):
    if request.method == 'GET':
        item = biobot.deck.find_one({'uuid': uid})
        deck_cursor = biobot.labware.find({'type': {'$ne': 'Tool'}})
        deck = sorted([item['name'] for item in deck_cursor])
        options = "<option value={0}>{1}</option>"
        all_options = [options.format(i, i.replace('_', ' ').title()) for i in deck]
        labware_options = Markup(''.join(all_options))

        if item['source'] == 'deck_editor':
            ini = {'x': round(conf.deck_length/100*int(item['col'])+conf.deck_length/200, 3),
                   'y': round(conf.deck_width/26*(ord(item['row'])-65)+conf.deck_width/52, 3)}
        else:
            ini = {'x': round(item['carto_x'], 3),
                   'y': round(item['carto_y'], 3)}

        return render_template('validate.html', item=item, ini=ini, \
                               labware_options=labware_options)

    else:
        biobot.deck.update_one({'uuid': uid}, {'$set': {'name': request.form['name'],
                                                        'id': request.form['id'],
                                                        'valid_x': request.form['valid_x'],
                                                        'valid_y': request.form['valid_y'],
                                                        'valid_z': request.form['valid_z'],
                                                        'validated': True}})

        return redirect(url_for('mapping'))

@app.route('/logs')
def logs():
    stats = list(biobot.stats.find())
    return render_template('logs.html', stats=stats)

@app.route('/logs/<protocol>')
def log_highlights(protocol):
    if not valid_protocol(protocol):
        return redirect(url_for('logs'))

    db = client[protocol]
    started = db.steps.count()
    done = db.steps.count({'end': {'$exists': True}})
    info = db.protocol.find_one()
    json_protocol = {}
    if info:
        json_protocol = json.dumps(info['protocol'], indent=4, sort_keys=True)

    return render_template('log_highlights.html', active='Highlights', \
                           protocol=protocol, json_protocol=json_protocol, \
                           started=started, done=done)

@app.route('/logs/<protocol>/steps')
def log_steps(protocol):
    if not valid_protocol(protocol):
        return redirect(url_for('logs'))

    db = client[protocol]
    steps = list(db.steps.find())
    return render_template('log_steps.html', active='Steps', protocol=protocol, steps=steps)

@app.route('/logs/<protocol>/colonies_analysis')
@app.route('/logs/<protocol>/colonies_analysis/step/<int:step>')
def log_colonies_analysis(protocol, step=None):
    if not valid_protocol(protocol):
        return redirect(url_for('logs'))

    db = client[protocol]
    colonies = list(db.colonies.find())

    if not colonies:
        flash("No bacterial colonies analysis was found for protocol {0}".format(protocol), 'warning')
        return redirect("/logs/{0}".format(protocol))

    df = pd.DataFrame(colonies)
    steps = sorted(df.step.unique())
    current_step = step if step else int(steps[0])
    current_colonies = list(db.colonies.find({'step': current_step}))
    colors = list(pd.DataFrame(current_colonies).color.unique())

    return render_template('log_colonies_analysis.html', active='Colony', \
                           protocol=protocol, steps=steps, current=current_step, \
                           colonies=current_colonies, colors=colors)

@app.route('/logs/delete/<protocol>')
@login_required
@admin_required
def delete_logs(protocol):
    if not valid_protocol(protocol):
        flash("Cannot delete unexisting protocol {0}".format(protocol), 'danger')
        return redirect(url_for('logs'))

    stats = biobot.stats.delete_one({'id': protocol})
    client.drop_database(protocol)
    flash("Entry{0} deleted successfully".format(protocol), 'info')
    return redirect(url_for('logs'))

@app.route('/manage_users')
@login_required
@admin_required
def manage_users():
    user_list = list(biobot.credentials.find())
    return render_template('manage_users.html', users=user_list)

@app.route('/manage_users/activate/<username>')
@login_required
@admin_required
def activate_user(username):
    user = biobot.credentials.find_one({'username': username})
    if not user.get('active', False):
        biobot.credentials.update_one(user, {'$set': {'active': True}})
        flash("User {0} activated successfully".format(username), 'success')
    else:
        flash("User {0} is already active".format(username), 'warning')

    return redirect(url_for('manage_users'))

@app.route('/manage_users/demote/<username>')
@login_required
@admin_required
def demote_user(username):
    user = biobot.credentials.find_one({'username': username})
    if current_user.get_id() == username:
        flash('Cannot revert yourself to standard user', 'danger')
    elif user:
        if user['admin']:
            biobot.credentials.update_one(user, {'$set': {'admin': False}})
            flash("User {0} reverted to standard user successfully".format(username), 'info')
        else:
            flash("User {0} is already a standard user".format(username), 'warning')
    else:
        flash("Cannot revert unknown user {0} to standard user".format(username), 'warning')

    return redirect(url_for('manage_users'))

@app.route('/manage_users/promote/<username>')
@login_required
@admin_required
def promote_user(username):
    user = biobot.credentials.find_one({'username': username})
    if user:
        if user['admin']:
            flash("User {0} is already an administrator".format(username), 'warning')
        else:
            biobot.credentials.update_one(user, {'$set': {'admin': True}})
            flash("User {0} promoted to administrator successfully".format(username), 'info')
    else:
        flash("Cannot promote unknown user {0} to administrator".format(username), 'warning')

    return redirect(url_for('manage_users'))

@app.route('/manage_users/delete/<username>')
@login_required
@admin_required
def delete_user(username):
    user = biobot.credentials.find_one({'username': username})
    if current_user.get_id() == username:
        flash('Cannot delete yourself', 'danger')
    elif user:
        biobot.credentials.delete_one(user)
        flash("User {0} deleted successfully".format(username), 'info')
    else:
        flash("Cannot delete unknown user {0}".format(username), 'warning')

    return redirect(url_for('manage_users'))

@app.route('/manage_labware', methods=['GET', 'POST'])
@login_required
@admin_required
def manage_labware():
    if request.method == 'POST':
        name = request.form['name'].lower().strip().replace(' ', '_')
        description = request.form['description']
        item_type = request.form['type']
        item = biobot.labware.find_one({'name': name})
        if not name:
            flash('Empty labware item name is invalid', 'danger')
        elif item:
            flash("Labware item {0} already exists".format(name), 'warning')
        else:
            biobot.labware.insert_one({'name': name, 'description': description, 'type': item_type})
            flash("Labware item {0} added successfully".format(name), 'success')

    labware_list = list(biobot.labware.find())
    return render_template('manage_labware.html', labware=labware_list)

@app.route('/manage_labware/delete/<name>')
@login_required
@admin_required
def delete_labware(name):
    item = biobot.labware.find_one({'name': name})
    if item:
        biobot.labware.delete_one(item)
        flash("Item {0} deleted successfully".format(name), 'info')
    else:
        flash("Cannot delete unknown item {0}".format(name), 'danger')

    return redirect(url_for('manage_labware'))

@app.route('/bad_permissions')
def bad_permissions():
    return render_template('bad_permissions.html')

@app.route('/get/schema/<value>')
def get_schema(value):
    """
    Returns the JSON Schema asked by JavaScript Ajax Request.
    If schema does not exist, it returns an empty JSON object.
    """

    schema = biobot_schema.get_schema(value, conf, biobot)
    return json.dumps(schema)

@app.errorhandler(404)
def page_not_found(error):
    """This method handles all unexisting route requests"""
    return render_template('404.html'), 404

# Add objects that can be called from the Jinja2 HTML templates
@app.template_filter()
@evalcontextfilter
def nl2br(eval_ctx, value):
    _paragraph_re = re.compile(r'(?:\r\n|\r|\n){2,}')
    result = '\n\n'.join('<p>%s</p>' % p.replace('\n', '<br>\n') \
        for p in _paragraph_re.split(escape(value)))
    result = result.replace(' ', '&nbsp;')
    if eval_ctx.autoescape:
        result = Markup(result)
    return result

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
    html = '<li{0}><a href="/{1}"><i style="float:left; margin-right: 14px;">'\
           '<span class="glyphicon glyphicon-{2}"></span></i>{3}' \
           '</a></li>'.format(active, url, icon, name)

    return Markup(html)

def get_picture(database, collection, filename, tags=""):
    db = client[database]
    coll = db[collection]
    image = coll.find_one({'filename': filename})
    if image:
        image_id = image['image_id']
        fs = GridFS(db)
        img = fs.get(image_id).read()
        b64data = base64.b64encode(img).decode('utf-8')
        html = '<img src="data:image/jpeg;base64,{0}" {1}>'.format(b64data, tags)
    else:
        html = "Image {0} not found".format(filename)
    return Markup(html)

app.jinja_env.globals.update(conf=conf,
                             force_type = Markup('onselect="return false" ' \
                                          'onpaste="return false" ' \
                                          'oncopy="return false" ' \
                                          'oncut="return false" ' \
                                          'ondrag="return false" ' \
                                          'ondrop="return false" ' \
                                          'autocomplete=off'),
                             format_sidebar=format_sidebar,
                             convert_ts=convert_ts,
                             get_picture=get_picture)

# Start the application
if __name__ == '__main__':
    app.run(debug=conf.debug, host=conf.app_host, port=int(conf.app_port))

