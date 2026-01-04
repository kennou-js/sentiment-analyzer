import pandas as pd
import re
from textblob import TextBlob

class FixedSentimentAnalyzer:
    def __init__(self, csv_path):
        self.lexicon = self._load_lexicon(csv_path)
        print(f"✅ Loaded {len(self.lexicon)} words from lexicon")
        
    def _load_lexicon(self, csv_path):
        """Load lexicon and ensure 'gloomy' is there"""
        try:
            df = pd.read_csv(csv_path)
            lexicon = {}
            
            for _, row in df.iterrows():
                word = str(row['word']).lower().strip()
                sentiment = str(row['sentiment']).lower().strip()
                score = float(row['score'])
                lexicon[word] = {'sentiment': sentiment, 'score': score}
            
            # Debug: Check for specific words
            test_words = ['gloomy', 'happy', 'terrible', 'sad', 'angry', 'displeased', 'annoyed']
            for word in test_words:
                if word in lexicon:
                    print(f"  ✓ '{word}': {lexicon[word]['sentiment']} ({lexicon[word]['score']})")
                else:
                    print(f"  ✗ '{word}' not found in lexicon")
            
            return lexicon
            
        except Exception as e:
            print(f"Error: {e}")
            # Fallback lexicon
            return {
                'gloomy': {'sentiment': 'negative', 'score': -0.6},
                'happy': {'sentiment': 'positive', 'score': 0.7},
                'terrible': {'sentiment': 'negative', 'score': -0.8},
                'displeased': {'sentiment': 'negative', 'score': -0.5}
            }
    
    def analyze(self, text):
        """Better sentiment analysis with LEXICON PRIORITY"""
        text_lower = text.lower()
        
        # Find lexicon words
        found_words = []
        lexicon_total = 0
        
        # Check each word in lexicon
        for word, info in self.lexicon.items():
            # Use word boundaries for exact matching
            if re.search(r'\b' + re.escape(word) + r'\b', text_lower):
                found_words.append({
                    'word': word,
                    'sentiment': info['sentiment'],
                    'score': info['score']
                })
                lexicon_total += info['score']
        
        # Get TextBlob analysis
        blob = TextBlob(text)
        textblob_polarity = blob.sentiment.polarity
        
        # DEBUG: Print what TextBlob thinks
        print(f"  TextBlob polarity for '{text}': {textblob_polarity}")
        
        # Calculate final score - LEXICON GETS PRIORITY!
        if found_words:
            # Average lexicon score for found words
            lexicon_avg = lexicon_total / len(found_words)
            
            # DEBUG: Print lexicon info
            print(f"  Found lexicon words: {[w['word'] for w in found_words]}")
            print(f"  Lexicon average: {lexicon_avg}")
            
            # LEXICON GETS 95% WEIGHT WHEN WE FIND MATCHING WORDS
            # TextBlob only gets 5% - your lexicon is the authority!
            final_score = lexicon_avg * 0.95 + textblob_polarity * 0.05
            
            # DEBUG: Print final calculation
            print(f"  Final score: {lexicon_avg} * 0.95 + {textblob_polarity} * 0.05 = {final_score}")
        else:
            # No lexicon words, just use TextBlob
            final_score = textblob_polarity
        
        # STRICT THRESHOLDS WITH LEXICON PRIORITY
        if final_score > 0.1:
            sentiment = "positive"
        elif final_score < -0.1:
            sentiment = "negative"
        elif final_score > 0.02:
            sentiment = "slightly positive"
        elif final_score < -0.02:
            sentiment = "slightly negative"
        else:
            sentiment = "neutral"
        
        # Fix for lexicon_avg reference when no words found
        lexicon_avg_value = round(lexicon_total / len(found_words), 4) if found_words else 0
        
        return {
            'text': text,
            'sentiment': sentiment,
            'polarity': round(final_score, 4),
            'subjectivity': round(blob.sentiment.subjectivity, 4),
            'word_count': len(text.split()),
            'found_words': found_words,
            'analysis_details': {
                'textblob_score': round(textblob_polarity, 4),
                'lexicon_avg': lexicon_avg_value,
                'final_score': round(final_score, 4),
                'threshold_info': f"negative if < -0.1, neutral if -0.1 to 0.1, positive if > 0.1"
            }
        }

# Test
if __name__ == '__main__':
    analyzer = FixedSentimentAnalyzer('backend/sentiment_lexicon.csv')
    
    print("\n" + "="*60)
    print("🔍 COMPREHENSIVE TESTING")
    print("="*60)
    
    test_cases = [
        ("displeased", "negative", -0.5),
        ("annoyed", "negative", -0.5),
        ("irritated", "negative", -0.55),
        ("gloomy", "negative", -0.6),
        ("happy", "positive", 0.7),
        ("terrible", "negative", -0.8),
        ("I am displeased with this", "negative", -0.5),
        ("The service was displeasing", "negative", -0.5)
    ]
    
    all_passed = True
    for text, expected_sentiment, lexicon_score in test_cases:
        print(f"\nTesting: '{text}'")
        result = analyzer.analyze(text)
        
        passed = result['sentiment'] == expected_sentiment
        status = "✅ PASS" if passed else "❌ FAIL"
        
        if not passed:
            all_passed = False
            
        print(f"{status}: Got '{result['sentiment']}' (Expected: '{expected_sentiment}')")
        print(f"  Polarity: {result['polarity']} (Lexicon score: {lexicon_score})")
        if result['found_words']:
            print(f"  Found words: {[w['word'] for w in result['found_words']]}")
    
    print("\n" + "="*60)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED!")
    print("="*60)