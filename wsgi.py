import sys
import os

# Explicitly add current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import app

if __name__ == '__main__':
    app.run()
