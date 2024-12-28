import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './ProductReviews.css';
import filledStar from '../Assets/star_icon.png';
import blankStar from '../Assets/star_dull_icon.png';

const ProductReview = () => {
  const location = useLocation();
  const { productId, productName } = location.state; // Accessing productId and productName from location state

  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  });
  const [userDetails, setUserDetails] = useState({}); // Store user details from localStorage
  const [hasReviewed, setHasReviewed] = useState(false); // Track if the user has already reviewed the product
  const [loading, setLoading] = useState(true); // To manage the loading state

  useEffect(() => {
    // Log the props to ensure they're passed correctly
    console.log("Product ID:", productId);
    console.log("Product Name:", productName);

    // Fetch user details from localStorage (assuming user is logged in)
    const storedUser = JSON.parse(localStorage.getItem('user-details'));
    if (storedUser) {
      setUserDetails(storedUser);

      // Check if the user has already submitted a review for this product
      const checkIfReviewed = async () => {
        try {
          const response = await fetch(`http://localhost:4000/reviews/check?user_id=${storedUser._id}&product_id=${productId}`);
          const responseData = await response.json();

          // Log the response to ensure correct data
          console.log("Review Check Response:", responseData);

          if (responseData.hasReviewed) {
            setHasReviewed(true);
          }
          setLoading(false); // Stop loading after the check
        } catch (error) {
          console.error('Error checking review status:', error);
          setLoading(false); // Stop loading if error occurs
        }
      };

      checkIfReviewed();
    } else {
      console.error('No user details found in localStorage.');
      setLoading(false); // Stop loading if no user found
    }
  }, [productId, productName]);

  const handleRatingChange = (rating) => {
    setNewReview((prevReview) => ({ ...prevReview, rating }));
  };

  const handleCommentChange = (e) => {
    setNewReview((prevReview) => ({ ...prevReview, comment: e.target.value }));
  };

  const handleReviewSubmit = async () => {
    const { _id: user_id, username: user_name } = userDetails;

    if (!productId || !productName) {
      alert('Invalid product details. Cannot submit review.');
      return;
    }

    if (newReview.rating === 0 || newReview.comment === '') {
      alert('Please fill out both rating and comment.');
      return;
    }

    const reviewData = {
      user_id,
      user_name,
      product_id: productId,
      product_name: productName,
      rating: newReview.rating,
      comment: newReview.comment,
    };

    try {
      const response = await fetch('http://localhost:4000/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const responseData = await response.json();

      console.log("Response Data:", responseData);

      if (!response.ok) {
        alert('Failed to submit review: ' + responseData.message);
        return;
      }

      // Clear the review form after submission
      setNewReview({ rating: 0, comment: '' });
      alert('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('An error occurred while submitting your review.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="product-review-container">
      <h2>Submit a Review for {productName || 'Unknown Product'}</h2> {/* Display product name */}
      {hasReviewed ? (
        <p>You have already rated this product.</p>
      ) : (
        <div className="new-review">
          <h3>Your Rating</h3>
          <div className="star-rating-input">
            {Array(5).fill().map((_, index) => (
              <img
                key={index}
                src={index < newReview.rating ? filledStar : blankStar}
                alt={index < newReview.rating ? 'filled star' : 'blank star'}
                className="star-image"
                onClick={() => handleRatingChange(index + 1)}
              />
            ))}
          </div>
          <textarea
            value={newReview.comment}
            onChange={handleCommentChange}
            placeholder="Write your review here"
          />
          <button onClick={handleReviewSubmit}>Submit Review</button>
        </div>
      )}
    </div>
  );
};

export default ProductReview;
