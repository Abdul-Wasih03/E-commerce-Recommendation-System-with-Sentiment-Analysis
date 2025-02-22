from flask import Flask, request, jsonify
import sys
import pandas as pd
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from sklearn.neighbors import NearestNeighbors
import numpy as np
from transformers import pipeline
import json
import os
from dotenv import load_dotenv

app = Flask(__name__)

# Load environment variables from .env file
load_dotenv()

# Get MongoDB URI from environment variable
uri = os.getenv('MONGO_URI')

# Connect to MongoDB
if uri:
    client = MongoClient(uri, server_api=ServerApi('1'))
    db = client['e-commerce']
    print("Connected to the database!")
else:
    print("MongoDB URI not found in environment variables.")

# Pre-load data for performance (optional but recommended for large-scale apps)
purchase_data = pd.DataFrame(list(db['purchases'].find()))
purchase_data_cleaned = purchase_data.drop(columns=['user_email', '__v'], errors='ignore')
purchase_data_cleaned = purchase_data_cleaned.dropna(subset=['user_id', 'product_name', 'quantity'])
user_item_matrix = purchase_data_cleaned.pivot_table(index='user_id', columns='product_name', values='quantity', aggfunc='sum', fill_value=0)
user_item_matrix.index = user_item_matrix.index.astype(str)

# Load review sentiment analysis model
sentiment_pipeline = pipeline("sentiment-analysis")

# KNN model setup (same as your current code)
user_item_matrix_np = user_item_matrix.values
model_knn = NearestNeighbors(metric='cosine', algorithm='brute')
model_knn.fit(user_item_matrix_np)

def get_recommendations_for_user(user_id):
    # Find the index of the user in the matrix
    if user_id not in user_item_matrix.index:
        return []

    user_index = np.where(user_item_matrix.index == user_id)[0][0]
    
    # Get the nearest neighbors
    distances, indices = model_knn.kneighbors(user_item_matrix_np[user_index].reshape(1, -1), n_neighbors=5)
    similar_user_indices = indices.flatten()
    similar_users = user_item_matrix.iloc[similar_user_indices]
    
    # Find products purchased by similar users but not by the target user
    target_user_products = user_item_matrix.iloc[user_index]
    recommendations = similar_users.columns[(similar_users > 0).any() & (target_user_products == 0)]
    purchased_products = user_item_matrix.loc[user_id][user_item_matrix.loc[user_id] > 0].index.tolist()
    
    # Filter out already purchased products from recommendations
    filtered_recommended_products = [product for product in recommendations if product not in purchased_products]
    
    # Perform sentiment analysis on the reviews of the recommended products
    reviews_collection = db['reviews']
    product_reviews = {}
    
    for review in reviews_collection.find():
        product_name = review['product_name']
        review_text = review['comment']
        if product_name in product_reviews:
            product_reviews[product_name].append(review_text)
        else:
            product_reviews[product_name] = [review_text]
    
    sentiment_scores = {}
    for product, reviews in product_reviews.items():
        if reviews:
            sentiment_sum = 0
            for review in reviews:
                result = sentiment_pipeline(review)[0]
                sentiment = 1 if result['label'] == 'POSITIVE' else -1
                sentiment_sum += sentiment
            sentiment_scores[product] = sentiment_sum / len(reviews)
        else:
            sentiment_scores[product] = 0

    # Combine recommendations with sentiment scores
    recommended_with_sentiment = [(product, sentiment_scores.get(product, 0)) for product in filtered_recommended_products]
    recommended_with_sentiment.sort(key=lambda x: x[1], reverse=True)
    
    # Return the final sorted list of recommended products
    final_recommendations = [product for product, score in recommended_with_sentiment]
    return final_recommendations

# Define the /recommend endpoint
@app.route('/recommend', methods=['POST'])
def recommend():
    user_id = request.json['user_id']
    
    # Get recommendations for the user
    recommended_products = get_recommendations_for_user(user_id)
    
    # Return recommendations as JSON response
    return jsonify({'recommended_products': recommended_products})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
