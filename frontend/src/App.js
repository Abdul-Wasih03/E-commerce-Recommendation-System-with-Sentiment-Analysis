import './App.css';
import Navbar from './Components/Navbar/Navbar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ShopCategory from './Pages/ShopCategory';
import LoginSignup from './Pages/LoginSignup';
import Shop from './Pages/Shop';
import Product from './Pages/Product';
import Cart from './Pages/Cart';
import YourOrders from './Components/YourOrders/YourOrders';
import Reviews from './Components/ProductReviews/ProductReviews';
import PaymentGateway from './Components/PaymentGateway/PaymentGateway';
import Footer from './Components/Footer/Footer';
import fruits_banner from './Components/Assets/banner_mens.png';
import vegetables_banner from './Components/Assets/banner_mens.png';
import spices_banner from './Components/Assets/banner_mens.png';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path='/' element={<Shop />} />
          <Route path='/fruits' element={<ShopCategory banner={fruits_banner} category="Fruits" />} />
          <Route path='/vegetables' element={<ShopCategory banner={vegetables_banner} category="Vegetables" />} />
          <Route path='/spices' element={<ShopCategory banner={spices_banner} category="Spices" />} />
          <Route path="/product" element={<Product />}>
            <Route path=':productId' element={<Product />} />
          </Route>
          <Route path='/cart' element={<Cart />} />
          <Route path="/your-orders" element={<YourOrders />} />
          <Route path="/payment" element={<PaymentGateway />} />
          <Route path='/login' element={<LoginSignup />} />
          <Route path="/your-orders/:userId" element={<YourOrders />} /> {/* Fixed route */}
          <Route path="/reviews/:productId" element={<Reviews />} /> {/* Fixed route */}
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
