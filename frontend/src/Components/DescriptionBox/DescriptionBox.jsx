import React, { useState, useEffect } from 'react';
import './DescriptionBox.css';
import filledStar from '../Assets/star_icon.png';
import blankStar from '../Assets/star_dull_icon.png';

const DescriptionBox = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`http://localhost:4000/reviews/${productId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        const data = await response.json();
        setReviews(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  const renderStars = (rating) => {
    const totalStars = 5;
    const filledStars = Array(rating).fill(filledStar); // Filled stars based on rating
    const blankStars = Array(totalStars - rating).fill(blankStar); // Remaining blank stars

    return (
      <div className="star-rating">
        {filledStars.map((star, index) => (
          <img key={index} src={star} alt="filled star" className="star-image" />
        ))}
        {blankStars.map((star, index) => (
          <img key={index + rating} src={star} alt="blank star" className="star-image" />
        ))}
      </div>
    );
  };

  return (
    <div className='descriptionbox'>
      <div className="descriptionbox-navigator">
        <div
          className={`descriptionbox-nav-box ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </div>
        <div
          className={`descriptionbox-nav-box ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </div>
      </div>

      {activeTab === 'description' && (
        <div className="descriptionbox-description">
          <p>Enjoy the freshness of our 100% organic selection, featuring naturally grown fruits, vegetables, and spices, free from synthetic pesticides and fertilizers. Packed with essential nutrients and rich flavors, each product is sourced sustainably to ensure farm-to-table goodness for your well-being.</p>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="descriptionbox-reviews">
          {loading ? (
            <p>Loading reviews...</p>
          ) : error ? (
            <p>{error}</p>
          ) : reviews.length > 0 ? (
            <div>
              <p><strong>{reviews.length}</strong> users reviewed this product</p>
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                <p className="review-header">
                  <strong>{review.user_name}</strong> : {renderStars(review.rating)} {/* Render star images */}
                </p>
                <p>{review.comment}</p>
              </div>              
              ))}
            </div>
          ) : (
            <p>No reviews yet for this product.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DescriptionBox;
