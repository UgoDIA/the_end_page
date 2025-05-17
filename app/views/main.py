from flask import Blueprint, render_template, send_from_directory, current_app
import os

main_bp = Blueprint('main', __name__)


@main_bp.route('/')
def index():
    return render_template('index.html')


@main_bp.route('/editeur')
def editeur():
    return render_template('editeur.html')


@main_bp.route('/feed')
def feed():
    return render_template('feed.html')


@main_bp.route('/<path:path>')
def serve_static(path):
    return send_from_directory(os.path.join(current_app.root_path, 'static'), path)
