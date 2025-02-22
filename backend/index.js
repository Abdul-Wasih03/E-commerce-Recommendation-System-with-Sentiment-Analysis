const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const axios = require('axios');
const { log } = require("console");
require('dotenv').config();



app.use(express.json());
app.use(cors());



// Database Connection with MongoDB
const mongoUri = process.env.MONGO_URI;
mongoose.connect(mongoUri)
.then(() => console.log("MongoDB Connected"))
    .catch((err) => {
        console.error("MongoDB connection error: ", err);
        process.exit(1);  // Exit process in case of a fatal error
    });

// Catch uncaught exceptions to avoid crashes
process.on('uncaughtException', (err) => {
    console.error("Uncaught Exception: ", err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled Rejection: ", reason);
});




// API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})


// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

// Creating Upload Endpoint for images
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for Creating Products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required:true,
    },
    name:{
        type: String,
        required:true,
    },
    image:{
        type: String,
        required:true,
    },
    category:{
        type: String,
        required:true,
    },
    new_price:{
        type: Number,
        required:true,
    },
    old_price:{
        type: Number,
        required:true,
    },
    date:{
        type: Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true
    },
})

app.post('/addproduct',async(req,res)=>{
    let products = await Product.find({});
    let id;
    if(products.length>0){

        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;

    }
    else{
        id=1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

// Creating API for deleting products

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name: req.body.name
    })
    
})

// Creating API for getting All products

app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("All Products Fetched")
    res.send(products);
})



// Schema Creating for User Model

const Users = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

//Creating Endpoint for Registering the user

app.post('/signup',async (req,res)=>{
    
    let check = await Users.findOne({email:req.body.email});
    if (check){
        return res.status(400).json({success:false,errors:"Existing User Found with same Email Address"})
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i]=0;        
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })  

    await user.save();

    const data ={
        user:{
            id:user.id
        }
    }

    const token = jwt.sign(data,'secret_ecom');
    res.json({success:true,token})

})

// Creating Endpoint for User Login
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
  
    if (user) {
      const passCompare = req.body.password === user.password;
      if (passCompare) {
        // Include more user details in the response (not just the token)
        const data = {
          user: {
            id: user.id,
          }
        };
        const token = jwt.sign(data, 'secret_ecom');
  
        // Return the user object along with the token
        res.json({
          success: true,
          token,
          user: {
            _id: user._id,
            username: user.name,  // Include username here
            email: user.email
          }
        });
      } else {
        res.json({ success: false, errors: "Wrong Password" });
      }
    } else {
      res.json({ success: false, errors: "Wrong Email Id" });
    }
  });


  

// Creating Endpoint for Highly Rated Items Data

app.get('/newcollections',async(req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8);
    console.log("Highly Rated Items Fetched");
    res.send(newcollection);
})

// Creating Endpoint for Best Sellers Data

app.get('/bestsellers',async(req,res)=>{
    let products = await Product.find({$or: [{category: "Vegetables"}, {category: "Fruits"}]});
    let popular = products.slice(0,4);
    console.log("Best Sellers Fetched");
    res.send(popular);
})

// Creating Middleware to Fetch User

    const fetchUser = async (req,res,next)=>{
        const token = req.header('auth-token');
        if(!token){
            res.status(401).send({errors:"Please Authenticate using valid token"})
        }
        else{
            try {
                const data = jwt.verify(token,'secret_ecom');
                req.user = data.user;
                next();
            } catch (error) {
                res.status(401).send({errors:"Please Authenticate using a valid token"})
            }
        }
    }

// Creating Endpoint for Adding Products to CartData

app.post('/addtocart',fetchUser,async(req,res)=>{

    console.log("Added",req.body.itemId);
    
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] +=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added")  
})

// Creating Endpoint for Remove Products from CartData

app.post('/removefromcart',fetchUser,async(req,res)=>{
    
    console.log("Removed",req.body.itemId);
    
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
        userData.cartData[req.body.itemId] -=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed")  
})

// Creating Endpoint to get CartData

app.post('/getcart',fetchUser,async(req,res)=>{
    
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);  
})


// Review Schema
const reviewSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_name: { type: String, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    product_name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
});

// Purchase Schema
const purchaseSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    user_name: { type: String, required: true },
    user_email: { type: String, required: true },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    product_name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    total_price: { type: Number, required: true },
    purchase_date: { type: Date, default: Date.now },
    payment_method: { type: String, required: true },
});

// Models
const Review = mongoose.model('Review', reviewSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);

// API to get all reviews
app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find(); // Fetch all reviews from the database
        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found' });
        }
        res.json(reviews);  // Return the full list of reviews as JSON
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ message: 'Server Error' });  // Handle server errors
    }
});


// API to get reviews grouped by product_id

app.get('/reviews-products', async (req, res) => {
    try {
        const productReviews = await Review.aggregate([
            {
                $group: {
                    _id: "$product_id", // Group by product_id
                    product_name: { $first: "$product_name" }, // Get the first product name associated with the product_id
                    totalReviews: { $sum: 1 }, // Count the number of reviews for each product
                    reviews: {
                        $push: {
                            user_name: "$user_name",
                            rating: "$rating",
                            comment: "$comment"
                        } // Collect the reviews details (user_name, rating, comment)
                    }
                }
            },
            {
                $project: {
                    _id: 0, // Exclude the product_id from the result
                    product_name: 1,
                    totalReviews: 1,
                    reviews: 1 // Include product name, review count, and the reviews array in the response
                }
            }
        ]);

        if (productReviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found for any product' });
        }

        res.json(productReviews); // Return the reviews grouped by product
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// API to get reviews by product_id
app.get('/reviews/:productId', async (req, res) => {
    const { productId } = req.params;
    try {
        // Update the query to use product_id to match the database structure
        const reviews = await Review.find({ product_id: productId });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
});


// API to add a review
app.post('/reviews', async (req, res) => {
    try {
        const { user_id, product_id } = req.body;

        // Check if a review already exists for this user and product
        const existingReview = await Review.findOne({
            user_id: new mongoose.Types.ObjectId(user_id),
            product_id: new mongoose.Types.ObjectId(product_id)
        });

        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this product.' });
        }

        // Create new review if none exists
        const review = new Review({
            user_id: new mongoose.Types.ObjectId(req.body.user_id), // Convert to ObjectId
            user_name: req.body.user_name,
            product_id: new mongoose.Types.ObjectId(req.body.product_id), // Convert to ObjectId
            product_name: req.body.product_name,
            rating: req.body.rating,
            comment: req.body.comment,
        });

        const newReview = await review.save();
        res.status(201).json(newReview);
    } catch (err) {
        console.error('Error adding review:', err);
        res.status(400).json({ message: 'Invalid review data' });
    }
});


// API to get all purchases
app.get('/purchases', async (req, res) => {
    try {
        const purchases = await Purchase.find(); // Fetch all purchases from the database
        if (purchases.length === 0) {
            return res.status(404).json({ message: 'No purchases found' });
        }
        res.json(purchases);  // Return the full list of purchases as JSON
    } catch (error) {
        console.error('Error fetching all purchases:', error);
        res.status(500).json({ message: 'Server Error' });  // Handle server errors
    }
});


// API to get purchase history by user_id
app.get('/purchases/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        // Find all purchases that match the user_id in the database
        const purchases = await Purchase.find({ user_id: userId });

        if (purchases.length === 0) {
            return res.status(404).json({ message: 'No purchases found for this user' });
        }

        // Format the response
        const formattedPurchases = {
            user_name: purchases[0].user_name, // Assuming user_name is the same across purchases for the same user
            user_email: purchases[0].user_email, // Assuming user_email is the same across purchases
            purchases: purchases.map(purchase => ({
                product_name: purchase.product_name,
                product_id: purchase.product_id,
                category: purchase.category,
                purchase_date: purchase.purchase_date,
                quantity: purchase.quantity,
                total_price: purchase.total_price,
                payment_method: purchase.payment_method
            }))
        };

        res.json(formattedPurchases);
    } catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});



// API to add a new purchase
app.post('/purchases', async (req, res) => {
    console.log("Request body: ", req.body);  
    try {
        const purchase = new Purchase({
            user_id: new mongoose.Types.ObjectId(req.body.user_id), // Convert to ObjectId
            user_name: req.body.user_name,
            user_email: req.body.user_email,
            product_id: new mongoose.Types.ObjectId(req.body.product_id), // Convert to ObjectId
            product_name: req.body.product_name,
            category: req.body.category,
            quantity: req.body.quantity,
            total_price: req.body.total_price,
            purchase_date: req.body.purchase_date || new Date(),  // Default to current date if not provided
            payment_method: req.body.payment_method,
        });

        const newPurchase = await purchase.save();
        res.status(201).json(newPurchase);
    } catch (err) {
        console.error('Error adding purchase:', err);
        res.status(400).json({ message: 'Invalid purchase data', error: err.message  });
    }
});


app.post('/recommendations', async (req, res) => {
    try {
        const recommendedProduct = new Recommendation(req.body);
        const savedRecommendation = await recommendedProduct.save();
        res.status(201).json(savedRecommendation);
    } catch (error) {
        console.error('Error saving recommendation:', error);
        res.status(500).json({ message: 'Error saving recommendation' });
    }
});

// Export the Express app as a serverless function
module.exports = app;
