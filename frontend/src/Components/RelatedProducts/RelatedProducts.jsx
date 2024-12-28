import React, { useEffect, useState } from 'react';
import './RelatedProducts.css';
import Item from '../Item/Item';

const RelatedProducts = () => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('user-details')); // Fetch user details from localStorage
    console.log('User ID:', userDetails._id); 
    if (userDetails && userDetails._id) {
      
      fetch(`http://localhost:5000/recommendations?user_id=${userDetails._id}`)
        .then((response) => response.json())
        .then((data) => setRecommendedProducts(data))
        .catch((error) => {
          console.error('Error fetching recommendations:', error);
        });
    }
  }, []);

  return (
    <div className='relatedproducts'>
      <h1>Recommended For You</h1>
      <hr />
      <div className="relatedproducts-item">
        {recommendedProducts.length > 0 ? (
          recommendedProducts.map((item, i) => (
            <Item 
              key={i}
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={item.new_price.toFixed(2)}
              old_price={item.old_price.toFixed(2)}
            />
          ))
        ) : (
          <p>No recommendations available.</p>
        )}
      </div>
    </div>
  );
}

export default RelatedProducts;
