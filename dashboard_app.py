from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import sys
import os

# Import the ONE AND ONLY analyzer
sys.path.append('backend')
from sentiment_analyzer import FixedSentimentAnalyzer

# Initialize analyzer
LEXICON_PATH = os.path.join('backend', 'sentiment_lexicon.csv')
analyzer = FixedSentimentAnalyzer(LEXICON_PATH)

print("✅ Using Fixed Sentiment Analyzer")

# Create Flask app
app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    print("Serving index.html")
    return send_file('index.html')

@app.route('/style.css')
def serve_css():
    print("Serving style.css")
    return send_file('style.css')

@app.route('/script.js')
def serve_js():
    print("Serving script.js")
    return send_file('script.js')

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Dashboard is running!'})

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        text = data.get('text', '').strip()
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        print(f"\n📝 Analyzing: '{text}'")
        result = analyzer.analyze(text)
        
        return jsonify(result)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 SENTIMENT ANALYSIS DASHBOARD")
    print("=" * 60)
    print("📊 Dashboard: http://localhost:5000")
    print("🔧 API: http://localhost:5000/api/analyze")
    print("❤️  Health: http://localhost:5000/api/health")
    print("=" * 60)
    
    # Quick test
    print("\n🔍 Quick test:")
    test_result = analyzer.analyze("gloomy")
    print(f"   'gloomy' → {test_result['sentiment']} (polarity: {test_result['polarity']})")
    
    # Check files
    for file in ['index.html', 'style.css', 'script.js']:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file}")
    
    print("\n🚀 Starting server...")
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)