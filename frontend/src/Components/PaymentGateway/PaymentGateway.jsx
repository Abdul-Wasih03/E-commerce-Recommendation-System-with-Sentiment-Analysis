import React, { useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import './PaymentGateway.css';
import { ShopContext } from '../../Context/ShopContext'; // Import ShopContext for accessing cartItems

const PaymentGateway = () => {
    const { all_product, cartItems} = useContext(ShopContext); // Access cartItems from context
    const [paymentMethod, setPaymentMethod] = useState('');
    const [upiDetails, setUpiDetails] = useState({ service: '', upiId: '' });
    const [cardDetails, setCardDetails] = useState({
        cardNumber: '',
        cardHolder: '',
        expiryDate: '',
        cvv: '',
    });

    const location = useLocation(); // Get state passed with navigate
    const totalAmount = location.state?.totalAmount || 0; // Extract the total amount from location state

    const handlePlaceOrder = async () => {
        // Fetch user details from localStorage
        const userDetails = JSON.parse(localStorage.getItem('user-details'));
        const { _id: user_id, username: user_name, email } = userDetails;
    
        if (!paymentMethod) {
            alert('Please select a payment method.');
            return;
        }
    
        let paymentStatus = false;
        let paymentDetails = {};
    
        // Payment method validation
        if (paymentMethod === 'UPI') {
            const upiPattern = /^[\w.-]+@[a-zA-Z]+$/;
            if (!upiPattern.test(upiDetails.upiId)) {
                alert('Please enter a valid UPI ID.');
                return;
            } else {
                paymentDetails = { method: 'UPI', upiId: upiDetails.upiId };
                paymentStatus = true;
            }
        }
    
        if (paymentMethod === 'Cash On Delivery') {
            paymentDetails = { method: paymentMethod };
            paymentStatus = true;
        }
    
        if (paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') {
            if (!cardDetails.cardNumber || cardDetails.cardNumber.length !== 16) {
                alert('Please enter a valid 16-digit card number.');
                return;
            }
    
            if (!cardDetails.cardHolder || !cardDetails.expiryDate || !cardDetails.cvv) {
                alert('Please fill in all card details.');
                return;
            }
    
            paymentDetails = { method: paymentMethod, cardNumber: cardDetails.cardNumber };
            paymentStatus = true;
        }
    
        if (paymentStatus) {
            const orderItems = all_product
                .filter((item) => cartItems[item.id] > 0)
                .map((item) => ({
                    product_id: item._id,
                    product_name: item.name,
                    category: item.category,
                    quantity: cartItems[item.id],
                    total_price: item.new_price * cartItems[item.id],
                }));
    
            let allOrdersSuccessful = true;  // Track if all orders succeed
    
            try {
                for (let item of orderItems) {
                    const purchaseData = {
                        user_id: user_id,
                        user_name: user_name,
                        user_email: email,
                        product_id: item.product_id,
                        product_name: item.product_name,
                        category: item.category,
                        quantity: item.quantity,
                        total_price: item.total_price,
                        purchase_date: new Date().toISOString(),
                        payment_method: paymentDetails.method,
                    };
    
                    console.log('Sending to backend:', purchaseData);
    
                    const response = await fetch('http://localhost:4000/purchases', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(purchaseData),
                    });
    
                    const responseData = await response.json();
    
                    if (!response.ok) {
                        alert('Failed to place order for product: ' + item.product_name + '. Error: ' + responseData.message);
                        allOrdersSuccessful = false;  // If any order fails, set this to false
                    }
                }
    
                // Show success message only if all orders were successful
                if (allOrdersSuccessful) {
                    alert('Order placed successfully!');
                    
                } else {
                    alert('Some items failed to order.');
                }
    
                // Clear cart or navigate to a confirmation page
            } catch (error) {
                console.error('Error placing order:', error);
                alert('An error occurred while placing the order.');
            }
        } else {
            alert('Please complete the payment details.');
        }
    };
    
   
    return (
        <div className="payment-gateway-wrapper">
            <div className="payment-form-group">
                {/* Payment Options Section */}
                <div className="payment-options">
                    <h1>Select Payment Method</h1>
                    <div className="payment-method">
                        <input
                            type="radio"
                            id="upi"
                            name="payment"
                            value="UPI"
                            onChange={() => setPaymentMethod('UPI')}
                        />
                        <label htmlFor="upi">UPI</label>
                    </div>
                    <div className="payment-method">
                        <input
                            type="radio"
                            id="Cash On Delivery"
                            name="payment"
                            value="Cash On Delivery"
                            onChange={() => setPaymentMethod('Cash On Delivery')}
                        />
                        <label htmlFor="Cash On Delivery">Cash on Delivery</label>
                    </div>
                    <div className="payment-method">
                        <input
                            type="radio"
                            id="credit-card"
                            name="payment"
                            value="Credit Card"
                            onChange={() => setPaymentMethod('Credit Card')}
                        />
                        <label htmlFor="credit-card">Credit Card</label>
                    </div>
                    <div className="payment-method">
                        <input
                            type="radio"
                            id="debit-card"
                            name="payment"
                            value="Debit Card"
                            onChange={() => setPaymentMethod('Debit Card')}
                        />
                        <label htmlFor="debit-card">Debit Card</label>
                    </div>
                </div>

                {/* Payment Details Section */}
                <div className="payment-details">
                    {paymentMethod === 'UPI' && (
                        <div className="upi-details">
                            <h2>Enter UPI Details</h2>
                            <select 
                                value={upiDetails.service}
                                onChange={(e) => setUpiDetails({ ...upiDetails, service: e.target.value })}
                            >
                                <option value="">Select UPI Service</option>
                                <option value="GPay">GPay</option>
                                <option value="PhonePe">PhonePe</option>
                                <option value="Paytm">Paytm</option>
                                <option value="AmazonPay">Amazon Pay</option>
                                <option value="Others">Others</option>
                            </select>
                            <input
                            type="text"
                            placeholder="Enter UPI ID"
                            value={upiDetails.upiId}
                            onChange={(e) => setUpiDetails({ ...upiDetails, upiId: e.target.value })}
                            pattern="^[\w.-]+@[a-zA-Z]+$"   // Pattern for UPI ID validation
                            title="Please enter a valid UPI ID (e.g., example@bank)"
                            required  // Makes the input field required
                        />

                        </div>
                    )}

                    {paymentMethod === 'Cash On Delivery' && (
                        <div className="Cash On Delivery-display">
                            <p>Due to handling costs, a nominal fee of ₹10 will be charged</p>
                        </div>
                    )}

                    {(paymentMethod === 'Credit Card' || paymentMethod === 'Debit Card') && (
                        <div className="card-details">
                            <h2>Enter Card Details</h2>
                            <input
                                type="text" // Using "text" to prevent issues with leading zeros
                                placeholder="Card Number"
                                maxLength="16"
                                value={cardDetails.cardNumber}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    
                                    // Ensure only numbers are entered and the length does not exceed 16 digits
                                    if (/^\d{0,16}$/.test(value)) {
                                        setCardDetails({ ...cardDetails, cardNumber: value });
                                    }
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Card Holder Name"
                                value={cardDetails.cardHolder}
                                onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value })}
                            />
                          <div className="expiry-cvv">
                          
                          <input
                                type="text"
                                placeholder="MM/YY"
                                value={cardDetails.expiryDate}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, ""); // Remove non-digit characters

                                    if (value.length >= 2) {
                                        const month = value.slice(0, 2);
                                        const year = value.slice(2, 4);

                                        // Check if the month is valid (<=12)
                                        if (parseInt(month) > 12) {
                                            value = "12"; // Reset month to 12 if invalid
                                        } else {
                                            value = month + "/" + year; // Add '/' after MM
                                        }
                                    }

                                    if (value.length > 5) {
                                        value = value.slice(0, 5); // Limit to MM/YY format
                                    }

                                    setCardDetails({ ...cardDetails, expiryDate: value });
                                }}
                                maxLength={5} // MM/YY is 5 characters
                                pattern="(0[1-9]|1[0-2])/[0-9]{2}" // Pattern to match MM/YY
                                title="Expiry date must be in MM/YY format"
                            />

                                <input
                                    type="password" // To hide the CVV input
                                    placeholder="CVV"
                                    maxLength={3}
                                    value={cardDetails.cvv}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        // Ensure only numbers are entered and the length does not exceed 3 digits
                                        if (/^\d{0,3}$/.test(value)) {
                                            setCardDetails({ ...cardDetails, cvv: value });
                                        }
                                    }}
                                    pattern="\d{3}"
                                    title="CVV must be a 3-digit number"
                                />
                            </div>

                        </div>
                    )}
                </div>
            </div>
            
            {/* Total Amount Section */}
            <div className="total-amount">
                <h2>Total Amount: ₹{(paymentMethod==='Cash On Delivery')?totalAmount+10:totalAmount}</h2>
            </div>


            {/* Place Order Button Section */}
            <div className="place-order-container">
                <button className="place-order-button" onClick={handlePlaceOrder}>
                    Place Order
                </button>
            </div>
        </div>
    );
};

export default PaymentGateway;
