import React, { createContext, useEffect, useState } from "react";

export const ShopContext= createContext(null);



const getDefaultCart=()=>{
    let cart= {};
    for (let index = 0; index < 300+1; index++) {
        cart[index]=0;
        
    }
    return cart;
}

const ShopContextProvider=(props)=>{


    const [all_product, setAll_Product] = useState([]);
    const [cartItems, setCartItems] = useState(getDefaultCart());

    useEffect(() => {
        fetch('http://localhost:4000/allproducts')
        .then((response) => response.json())
        .then((data) => setAll_Product(data))
    
        if(localStorage.getItem('auth-token')){
            fetch('http://localhost:4000/getcart',{
                method:'POST',
                headers:{
                    Accept:'application/form-data',
                    'auth-token':`${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:"",
            })
            .then((response) => {
                if (response.ok) {
                    // Check if the response has a body to parse
                    return response.json();
                }
                return null; // Handle cases where there is no body
            })
            .then((data) => {
                if (data) {
                    setCartItems(data); // Only set cart items if data exists
                }
            })
            .catch((error) => {
                console.error("Error fetching cart data:", error);
            });
        }
    }, [])
    


    const addToCart =(itemId) =>{
        setCartItems((prev)=>({...prev,[itemId]:prev[itemId]+1}));
        if(localStorage.getItem('auth-token')){
            fetch('http://localhost:4000/addtocart',{
                method:'POST',
                headers:{
                    Accept: 'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemId":itemId}),
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    }

    const removeFromCart =(itemId) =>{
        setCartItems((prev)=>({...prev,[itemId]:prev[itemId]-1}));
        if(localStorage.getItem('auth-token')){
            fetch('http://localhost:4000/removefromcart',{
                method:'POST',
                headers:{
                    Accept: 'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type':'application/json',
                },
                body:JSON.stringify({"itemId":itemId}),
            })
            .then((response)=>response.json())
            .then((data)=>console.log(data));
        }
    }

    const getTotalCartAmount=()=>{
        let totalAmount = 0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                let itemInfo=all_product.find((product)=>product.id===Number(item))
                totalAmount += itemInfo.new_price * cartItems[item];
            }
            
        }
        return totalAmount;
    }

    const getTotalCartItems = () =>{
        let totalItem=0;
        for(const item in cartItems){
            if(cartItems[item]>0){
                totalItem+=cartItems[item];
            }
        }
        return totalItem;
    }

    const clearCart = () => {
        setCartItems(getDefaultCart()); // Reset the cart to the default state
    
        if (localStorage.getItem('auth-token')) {
            fetch('http://localhost:4000/clearcart', {  // Optional: to clear the cart in the backend
                method: 'POST',
                headers: {
                    Accept: 'application/form-data',
                    'auth-token': `${localStorage.getItem('auth-token')}`,
                    'Content-Type': 'application/json',
                },
                body: "", // Empty body
            })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                }
                return null;
            })
            .then((data) => {
                if (data) {
                    console.log("Cart cleared on the server");
                }
            })
            .catch((error) => {
                console.error("Error clearing cart on the server:", error);
            });
        }
    };
      
    const contextValue={getTotalCartItems,getTotalCartAmount,all_product,cartItems,addToCart,removeFromCart,clearCart};

    return(
        <ShopContext.Provider value={contextValue}>
            {props.children}
        </ShopContext.Provider>
    )
}

export default ShopContextProvider;