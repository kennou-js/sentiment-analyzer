# Sentiment Analysis Dashboard

A real-time web application for analyzing sentiment in text using natural language processing and machine learning techniques.

## Features
- Real-time Sentiment Analysis: Analyze text for positive, negative, or neutral sentiment
- Interactive Dashboard: Visualize sentiment scores with charts and metrics
- Multiple Input Methods: Support for text input and file upload
- Historical Analysis: Track and compare previous sentiment analyses
- Responsive Design: Works on desktop and mobile devices

## Project Structure
```
sentiment-analyzer/
├── index.html          # Main HTML file
├── style.css           # CSS styles
├── script.js           # Frontend JavaScript
├── dashboard_app.py    # Flask backend application
├── requirements.txt    # Python dependencies
└── backend/
    └── sentiment_analyzer.py  # Core sentiment analysis logic
```

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Setup
1. Clone the repository:
```bash
git clone https://github.com/kennou-js/sentiment-analyzer.git
cd sentiment-analyzer
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python dashboard_app.py
```

5. Open your browser and navigate to:
```
http://localhost:5000
```

## Usage

1. Launch the application as described above
2. Enter text in the input box or upload a text file
3. Click "Analyze Sentiment" to process the text
4. View results including:
   - Sentiment polarity score (-1 to 1)
   - Sentiment classification (Positive/Negative/Neutral)
   - Confidence metrics
   - Visual charts and graphs

## API Endpoints

- `POST /analyze` - Analyze text sentiment
- `GET /history` - Get analysis history
- `POST /upload` - Upload and analyze text file

## Technologies Used

### Backend
- Python
- Flask (Web framework)
- NLTK (Natural Language Toolkit)
- TextBlob (Sentiment analysis)
- scikit-learn (Machine learning)

### Frontend
- HTML5
- CSS3
- JavaScript (ES6+)
- Chart.js (Data visualization)

### Development Tools
- Git (Version control)
- GitHub (Repository hosting)

## Configuration

The application can be configured by modifying:
 - `dashboard_app.py` for server settings
 - `backend/sentiment_analyzer.py` for analysis parameters
 - `style.css` for UI customization

## Troubleshooting

### Common Issues

1. **Port already in use**: Change the port in `dashboard_app.py`
2. **Missing dependencies**: Run `pip install -r requirements.txt`
3. **NLTK data missing**: The application will download required data on first run

### Logs
Check the console output for error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built as a demonstration of NLP and web development integration
- Uses open-source libraries and tools
- Designed for educational and practical applications

## Contact

For questions or support, please open an issue in the GitHub repository.
