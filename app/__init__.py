from flask import Flask
import os
from dotenv import load_dotenv
from app.database import db

# Load environment variables
load_dotenv()


def create_app():
    app = Flask(__name__,
                static_folder='static',
                static_url_path='')

    # Configuration
    app.config.from_mapping(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev'),
        APPLICATION_ROOT=os.getenv(
            'APPLICATION_ROOT', '/home/username/public_html/your_app'),
        SQLALCHEMY_DATABASE_URI=os.getenv('DATABASE_URL'),
        SQLALCHEMY_TRACK_MODIFICATIONS=False
    )

    # Initialize database
    db.init_app(app)

    # Register blueprints
    from app.views.main import main_bp
    from app.views.api import api_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp, url_prefix='/api')

    # Create database tables
    with app.app_context():
        db.create_all()

    return app
