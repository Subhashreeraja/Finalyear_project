from app import create_app
from app.db import init_db

app = create_app()

if __name__ == "__main__":
    try:
        init_db()
    except Exception as e:
        print("DB init warning:", e)
    app.run(host="0.0.0.0", port=5000, debug=True)
