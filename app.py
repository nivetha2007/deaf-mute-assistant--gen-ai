from flask import Flask, send_from_directory, request, jsonify, session, redirect, url_for
import os

app = Flask(__name__)
app.secret_key = os.urandom(24)
users = {}

# Serve your frontend
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/app')
def app_page():
    if session.get('user'):
        return send_from_directory('.', 'app.html')
    return redirect(url_for('login_page'))

@app.route('/login')
def login_page():
    return send_from_directory('.', 'login.html')

@app.route('/signup')
def signup_page():
    return send_from_directory('.', 'signup.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login_page'))

# API for AI chat
@app.route('/api/generate-response', methods=['POST'])
def generate_response():
    data = request.json
    message = data.get('message', '')
    # Example: echo back (replace with actual AI code)
    return jsonify({"reply": f"You said: {message}"})

@app.route('/api/signup', methods=['POST'])
def api_signup():
    data = request.json or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    if not name or not email or not password:
        return jsonify({'error': 'Missing fields'}), 400
    if email in users:
        return jsonify({'error': 'Email already registered'}), 409
    users[email] = {'name': name, 'password': password}
    session['user'] = {'email': email, 'name': name}
    return jsonify({'ok': True})

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    user = users.get(email)
    if not user or user['password'] != password:
        return jsonify({'error': 'Invalid credentials'}), 401
    session['user'] = {'email': email, 'name': user['name']}
    return jsonify({'ok': True})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000)
