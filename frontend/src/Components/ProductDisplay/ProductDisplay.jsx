import React, { useState, useEffect, useContext } from 'react';
import './ProductDisplay.css';
import star_icon from '../Assets/star_icon1.png';
import star_dull_icon from '../Assets/star_dull_icon1.png';
import { ShopContext } from '../../Context/ShopContext';

const ProductDisplay = (props) => {
  const { product } = props;
  const { addToCart } = useContext(ShopContext);

  const [selectedQuantity, setSelectedQuantity] = useState('250g');
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  // Handler for quantity selection
  const handleQuantityChange = (e) => {
    setSelectedQuantity(e.target.value);
  };

  // Fetch reviews for the product
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`http://localhost:4000/reviews/${product._id}`);
        const data = await response.json();
        setReviews(data);

        // Calculate the average rating
        const totalRating = data.reduce((acc, review) => acc + review.rating, 0);
        const avgRating = totalRating / data.length || 0;
        setAverageRating(avgRating);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [product._id]);

  // Render stars based on the average rating
  const renderStars = () => {
    const fullStars = Math.floor(averageRating); // full stars
    const hasHalfStar = averageRating % 1 !== 0; // check for half star
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<img key={i} src={star_icon} alt="star" />);
    }

    // Optional: If you want to add a half star image, you can include it here
    if (hasHalfStar) {
      stars.push(<img key="half" src={star_icon} alt="half-star" />);
    }

    // Fill the remaining stars with dull stars
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      stars.push(<img key={i} src={star_dull_icon} alt="dull-star" />);
    }

    return stars;
  };

  return (
    <div className='productdisplay'>
      <div className="productdisplay-left">
        <div className="productdisplay-img-list">
          <img src={product.image} alt="" />
          <img src={product.image} alt="" />
          <img src={product.image} alt="" />
        </div>
        <div className="productdisplay-img">
          <img className='productdisplay-main-img' src={product.image} alt="" />
        </div>
      </div>
      <div className="productdisplay-right">
        <h1>{product.name}</h1>
        <div className="productdisplay-right-star">
          {renderStars()} {/* Render the calculated stars */} {averageRating.toFixed(1)}
          <p>({reviews.length})</p> {/* Display the number of reviews */}
        </div>
        <div className="productdisplay-right-prices">
          <div className="productdisplay-right-price-old">₹{product.old_price.toFixed(2)}</div>
          <div className="productdisplay-right-price-new">₹{product.new_price.toFixed(2)}</div>
        </div>
        <div className="productdisplay-right-description">
        Our fresh organic selection offers naturally grown fruits, vegetables, and spices, free from synthetic pesticides and fertilizers. Packed with essential nutrients and rich flavors, each product is sourced sustainably for your well-being.
        </div>
        <div className="productdisplay-right-size">
          <h1>Select Quantity</h1>
          <div className="productdisplay-right-sizes">
            <label>
              <input
                type="radio"
                value="250g"
                checked={selectedQuantity === '250g'}
                onChange={handleQuantityChange}
              />
              250g
            </label>
            <label>
              <input 
                type="radio" 
                value="500g" 
                checked={selectedQuantity === '500g'}
                onChange={handleQuantityChange}
              />
              500g
            </label>
            <label>
              <input 
                type="radio" 
                value="1kg" 
                checked={selectedQuantity === '1kg'}
                onChange={handleQuantityChange}
              />
              1kg
            </label>
            <label>
              <input 
                type="radio" 
                value="2kg" 
                checked={selectedQuantity === '2kg'}
                onChange={handleQuantityChange}
              />
              2kg
            </label>
          </div>
        </div>
        <button onClick={() => addToCart(product.id, selectedQuantity)}>Add to Cart</button>
        <p className="productdisplay-right-category"><span>Category : </span>{product.category}</p>
        <p className="productdisplay-right-category"><span>Tags : </span>Fresh, Organic</p>
      </div>
    </div>
  );
};

export default ProductDisplay;
