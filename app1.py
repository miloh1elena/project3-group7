import numpy as np
import pandas as pd
import datetime as dt
import sqlite3
import json

import sqlalchemy
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, func, inspect

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS  # Import CORS from flask_cors

engine = create_engine("sqlite:///final_data.sqlite")

Base = automap_base()
Base.prepare(autoload_with=engine)

inspector = inspect(engine)
print(inspector.get_table_names())

threads = Base.classes.thread

app = Flask(__name__)
CORS(app)  # Enable CORS for the entire app to allow requests from any origin

@app.route('/')
def index():
    return ("Welcome to the thread API "
            f"Available Routes:<br/>"
            f"/api/v1.0/source<br/>"
            f"/api/v1.0/review_date<br/>"
            f"/api/v1.0/rating<br/>"
            f"/api/v1.0/r_description"
            )

# Serve the index.html file
@app.route('/index.html')
def serve_index():
    return send_from_directory('static', 'index.html')

# Serve the plots.js file
@app.route('/plots.js')
def serve_plots():
    return send_from_directory('static', 'plots.js')

#################################################
# Database Setup
#################################################

@app.route("/api/v1.0/source")
def get_source():
    session = Session(engine)
    results = session.query(threads.source).all()
    session.close()  # Corrected to call the close() method
    all_source = list(np.ravel(results))
    return jsonify(all_source)

@app.route("/api/v1.0/r_description")
def get_description():
    session = Session(engine)
    desc = session.query(threads.review_description).all()
    all_desc = list(np.ravel(desc))
    session.close()  # Corrected to call the close() method
    return jsonify(all_desc)

@app.route("/api/v1.0/review_date")
def get_review_date():
    session = Session(engine)
    results2 = session.query(threads.review_date).all()
    session.close()  # Corrected to call the close() method
    all_review_date = list(np.ravel(results2))
    return jsonify(all_review_date)

@app.route("/api/v1.0/rating")
def get_rating():
    session = Session(engine)
    ratings = str(session.query(threads.rating).all())
    session.close()  # Corrected to call the close() method
    all_rating = (np.ravel(ratings))
    return jsonify(str(all_rating))

if __name__ == '__main__':
    app.run(host='localhost', port=8000, debug=False)