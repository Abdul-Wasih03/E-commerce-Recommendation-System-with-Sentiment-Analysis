from flask import Flask, jsonify, request
from flask_cors import CORS  # Add this import
from transformers import pipeline
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.neighbors import NearestNeighbors
from statsmodels.tsa.arima.model import ARIMA
from dotenv import load_dotenv
import os

# Access variables
uri = os.getenv("MONGO_URI")

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI from environment variable
uri = os.getenv('MONGO_URI')

# Connect to MongoDB
if uri:
    client = MongoClient(uri)
    db = client['e-commerce']
    print("Connected to the database!")
else:
    print("MongoDB URI not found in environment variables.")


# Load a pre-trained BERT model for sentiment analysis
sentiment_pipeline = pipeline("sentiment-analysis")

# Function to get product recommendations
def get_recommendations(user_id):
    # Fetch purchases data from MongoDB
    purchases = pd.DataFrame(list(db.purchases.find()))

    # Check if purchases DataFrame is empty
    if purchases.empty:
        raise ValueError("No purchases found in the database.")

    # Clean the data
    purchase_data_cleaned = purchases.drop(columns=['user_email', '__v'], errors='ignore')
    purchase_data_cleaned = purchase_data_cleaned.dropna(subset=['user_id', 'product_name', 'quantity'])

    # Create User-Item Matrix
    user_item_matrix = purchase_data_cleaned.pivot_table(
        index='user_id',
        columns='product_name',
        values='quantity',
        aggfunc='sum',
        fill_value=0
    )

    # Ensure user_id is treated as a string
    user_id_str = str(user_id)

    # Find the user index
    user_index = np.where(user_item_matrix.index.astype(str) == user_id_str)[0]

    if user_index.size == 0:
        raise ValueError(f"User ID {user_id_str} not found in the user-item matrix.")

    # KNN Model for Collaborative Filtering
    user_item_matrix_np = user_item_matrix.values
    model_knn = NearestNeighbors(metric='cosine', algorithm='brute')
    model_knn.fit(user_item_matrix_np)

    # Reshape the user index to fit the kneighbors function input format
    user_index_reshaped = user_item_matrix_np[user_index].reshape(1, -1)

    # Find the k nearest neighbors (e.g., k=5)
    distances, indices = model_knn.kneighbors(user_index_reshaped, n_neighbors=5)

    # Get the indices of the similar users
    similar_user_indices = indices.flatten()
    similar_users = user_item_matrix.iloc[similar_user_indices]
    target_user_products = user_item_matrix.iloc[user_index[0]]  # Correctly access the user's products

    # Get the products the user hasn't bought but similar users have
    recommendations = similar_users.columns[(similar_users > 0).any() & (target_user_products == 0)]

    # Get the purchased products of the user
    purchased_products = target_user_products[target_user_products > 0].index.tolist()
    recommended_products = recommendations.tolist()

    # Filter the recommended products to exclude those already purchased
    filtered_recommended_products = [product for product in recommended_products if product not in purchased_products]

    # Fetch and organize reviews by product for sentiment analysis
    product_reviews = {}
    for review in db.reviews.find():
        product_name = review['product_name']
        review_text = review['comment']
        if product_name in product_reviews:
            product_reviews[product_name].append(review_text)
        else:
            product_reviews[product_name] = [review_text]

    # Calculate sentiment scores for recommended products using BERT
    sentiment_scores = {}
    for product in filtered_recommended_products:
        reviews = product_reviews.get(product, [])
        if reviews:  # If there are reviews for the product
            sentiment_sum = 0
            for review in reviews:
                result = sentiment_pipeline(review)[0]
                sentiment = 1 if result['label'] == 'POSITIVE' else -1  # Convert sentiment to a score
                sentiment_sum += sentiment
            sentiment_scores[product] = sentiment_sum / len(reviews)  # Average sentiment score
        else:
            sentiment_scores[product] = 0  # Default score for products without reviews

    # Combine recommendations with sentiment scores
    recommended_with_sentiment = [(product, sentiment_scores.get(product, 0)) for product in filtered_recommended_products]
    recommended_with_sentiment.sort(key=lambda x: x[1], reverse=True)  # Sort by sentiment score

    # Fetch product details from the products collection
    product_details = []
    for product_name, _ in recommended_with_sentiment[:8]:  # Top 8 recommendations
        product_info = db.products.find_one({"name": product_name})
        if product_info:
            product_details.append({
                "_id": str(product_info["_id"]),
                "id": product_info["id"],
                "name": product_info["name"],
                "image": product_info["image"],
                "category": product_info["category"],
                "new_price": product_info["new_price"],
                "old_price": product_info["old_price"],
                "available": product_info["available"],
                "date": product_info["date"],
                "__v": 0
            })

    return product_details


# Step 1: Function to get aggregated sales data from 'purchases' collection in MongoDB
def get_sales_data_from_purchases():
    # Fetch purchases data from MongoDB
    purchases = pd.DataFrame(list(db.purchases.find()))
    
    # Ensure the necessary fields are present
    if 'purchase_date' not in purchases.columns or 'total_price' not in purchases.columns:
        raise ValueError("Purchases data must have 'purchase_date' and 'total_price' fields")
    
    # Convert 'purchase_date' to datetime format
    purchases['purchase_date'] = pd.to_datetime(purchases['purchase_date'])
    
    # Aggregate sales by date (summing the total_price for each date)
    daily_sales = purchases.groupby(purchases['purchase_date'].dt.date)['total_price'].sum().reset_index()
    
    # Rename columns for clarity
    daily_sales.columns = ['date', 'sales']
    
    return daily_sales

# Step 2: Modify the ARIMA model to use sales data from 'purchases'
def run_arima_model():
    # Get sales data aggregated by purchase date
    sales_data = get_sales_data_from_purchases()
    
    # Set 'date' as index for time series modeling
    sales_data.set_index('date', inplace=True)
    
    # Create ARIMA model (you can adjust p, d, q as needed)
    model = ARIMA(sales_data['sales'], order=(5, 1, 0))  # Adjust order based on your data's behavior
    model_fit = model.fit()
    
    # Forecast the next 30 days of sales
    forecast = model_fit.forecast(steps=30)
    
    # Prepare the forecast as a list of dictionaries (date and predicted sales)
    future_dates = pd.date_range(sales_data.index[-1] + pd.Timedelta(days=1), periods=30)
    forecast_df = pd.DataFrame({'date': future_dates, 'predicted_sales': forecast})
    
    return forecast_df.to_dict(orient='records')

# Step 3: Create a new endpoint for sales forecasting
@app.route('/sales-forecast', methods=['GET'])
def sales_forecast():
    try:
        forecast = run_arima_model()  # Get sales forecast based on purchases data
        return jsonify(forecast)
    except Exception as e:
        print(e)
        return jsonify({"error": "An error occurred while fetching sales forecast"}), 500


# API Endpoint for recommendations
@app.route('/recommendations', methods=['GET'])
def recommendations():
    user_id = request.args.get('user_id')  # Get user_id from the request
    if user_id is None:
        return jsonify({"error": "user_id is required"}), 400

    try:
        # Get recommendations for the specified user
        recommended_products = get_recommendations(user_id)
        return jsonify(recommended_products)
    except Exception as e:
        print(e)
        return jsonify({"error": "An error occurred while fetching recommendations"}), 500

# Start the Flask app
if __name__ == '__main__':
    app.run(debug=True, port=5000)
