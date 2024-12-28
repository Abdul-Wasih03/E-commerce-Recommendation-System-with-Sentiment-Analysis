import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // useNavigate instead of useHistory
import './YourOrders.css'; // Import your CSS file

const YourOrders = () => {
  const { userId } = useParams();
  const navigate = useNavigate(); // useNavigate instead of useHistory
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('user-details'));
    if (!userDetails || userDetails._id !== userId) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-details');
      window.location.replace('/login');
    } else {
      const fetchOrdersAndProducts = async () => {
        try {
          // Fetch Orders
          const response = await fetch(`http://localhost:4000/purchases/${userId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch orders');
          }
          const data = await response.json();
          
          // Sort orders by purchase date (most recent first)
          const sortedOrders = data.purchases.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
          setOrders(sortedOrders);

          // Fetch Product details
          const productResponse = await fetch(`http://localhost:4000/allproducts`); // Adjust API endpoint for product details
          if (!productResponse.ok) {
            throw new Error('Failed to fetch product details');
          }
          const productData = await productResponse.json();
          
          // Convert the product array into a map/object for easier lookup by product ID
          const productMap = productData.reduce((acc, product) => {
            acc[product._id] = product; // Assuming product._id is the unique product identifier
            return acc;
          }, {});
          
          setProducts(productMap);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching orders or products:", error);
          setError(error.message);
          setLoading(false);
        }
      };
      fetchOrdersAndProducts();
    }
  }, [userId]);

  const handleReviewClick = (productId, productName) => {
    // Use navigate to redirect to the review page with productId and productName as state
    navigate(`/reviews/${productId}`, { state: { productId, productName } });
  };
  

  if (loading) {
    return <div>Loading your orders...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="your-orders">
      <h1>Your Previous Orders</h1>
      {orders.length === 0 ? (
        <p>No previous orders found.</p>
      ) : (
        <div className="orders-list">
          <div className="order-format-header">
            <p>Product</p>
            <p>Name</p>
            <p>Price</p>
            <p>Quantity</p>
            <p>Total</p>
            <p>Order Date</p>
            <p>Payment Method</p>
            <p>Review</p> {/* Add Review column */}
          </div>
          <hr />
          {orders.map((order, index) => {
            const product = products[order.product_id]; // Assuming order has product_id field
            return (
              <div key={index}>
                <div className="order-format">
                  {product ? (
                    <img src={product.image} alt={product.name} className="order-product-image" />
                  ) : (
                    <p>No Image Available</p>
                  )}
                  <p>{order.product_name}</p>
                  <p>₹{order.total_price / order.quantity}</p>
                  <p>{order.quantity}</p>
                  <p>₹{order.total_price}</p>
                  <p>{order.purchase_date.split("T")[0].split("-").reverse().join("-")}</p>
                  <p>{order.payment_method}</p>
                  <button 
                    className="rate-button"
                    onClick={() => handleReviewClick(order.product_id, order.product_name)} // Pass productId and productName
                  >
                    Rate this product
                  </button>
                </div>
                <hr />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default YourOrders;
