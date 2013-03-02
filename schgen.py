from flask import Flask, jsonify
from flask import request as frequest
from werkzeug.serving import run_simple
import requests

app = Flask(__name__)
app.debug = True

@app.route('/')
def index():
    return 'Index Page'

@app.route('/schgen/')
def schgen():
    return 'Hello World!'

@app.route('/schgen/courses.json')
def courses():
	return frequest.args
	# return jsonify({"a": 1, "b": 2, "c": 3})

if __name__ == '__main__':
    run_simple('0.0.0.0', 5001, app,
        use_reloader=True, use_debugger=True, use_evalex=True)
