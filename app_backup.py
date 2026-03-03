from flask import Flask, send_from_directory, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.genai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)
app.secret_key = os.urandom(24)
# In-memory users store (reset when server restarts)
users = {
    # pre-created demo account for quick testing
    "demo@example.com": {"name": "Demo User", "password": "demo"}
}

# Initialize Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None

# Serve static files (CSS, JS, etc)
@app.route('/<path:filename>')
def serve_static(filename):
    if filename and '.' in filename:
        return send_from_directory('.', filename)
    return send_from_directory('.', 'index.html')

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
    try:
        data = request.json
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        if not client:
            return jsonify({"error": "API key not configured"}), 500
        
        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=message
        )
        
        return jsonify({"reply": response.text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    app.run(host='127.0.0.1', port=5000, debug=True)
