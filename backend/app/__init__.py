from flask import Flask
from flask_cors import CORS
from config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

    from app.routes import auth, alerts
    app.register_blueprint(auth.bp, url_prefix="/api/auth")
    app.register_blueprint(alerts.bp, url_prefix="/api/alerts")

    return app
