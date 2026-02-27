from flask_cors import CORS
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes so the frontend can freely communicate with the backend
CORS(app)

# Initialize Gemini client
# Ensure the GEMINI_API_KEY is set in your .env file
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY is not set in the .env file.")

client = genai.Client(api_key=api_key)

@app.route('/api/generate-response', methods=['POST'])
def generate_response():
    try:
        data = request.get_json()
        if not data or 'message' not in data:
            return jsonify({'reply': 'Error: Missing "message" field in JSON payload'}), 400

        user_message = data['message']
        
        # Send the message to the Gemini model
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=user_message,
        )
        
        # Return the AI response in the expected format
        return jsonify({'reply': response.text})

    except Exception as e:
        print(f"Error generating response: {e}")
        return jsonify({'reply': 'An error occurred while connecting to the AI model. Please check the server logs.'}), 500

if __name__ == '__main__':
    print("="*55)
    print("🚀 Starting AI Communication Assistant Backend...")
    print("📡 Server running on: http://127.0.0.1:5000")
    print("🔑 Using model: gemini-1.5-flash")
    print("="*55)
    
    # Run server on local port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
