from flask import Flask

from modules.db_manager import DB_PATH, init_db


def create_app(test_config: dict | None = None) -> Flask:
    """Flask application factory."""
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY="change-me",
        DATABASE=DB_PATH,
    )

    if test_config:
        app.config.update(test_config)

    # Ensure database and seed data exist before serving requests.
    init_db()

    from .routes import bp as web_bp
    from .customers import bp as customers_bp
    from .products import bp as products_bp

    app.register_blueprint(web_bp)
    app.register_blueprint(customers_bp)
    app.register_blueprint(products_bp)

    return app
