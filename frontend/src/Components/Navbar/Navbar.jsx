import React, { useContext, useState, useRef } from 'react'
import logo from '../Assets/logo.png'
import cart_icon from '../Assets/cart_icon.png'
import './Navbar.css'
import { Link } from 'react-router-dom'
import { ShopContext } from '../../Context/ShopContext'
import nav_dropdown from '../Assets/nav_dropdown.png'

const Navbar = () => {

    const[menu,setMenu]=useState("shop");
    const {getTotalCartItems}=useContext(ShopContext);
    const menuRef=useRef();

    const dropdown_toggle=(e)=>{
      menuRef.current.classList.toggle('nav-menu-visible')
      e.target.classList.toggle('open');
    }


  return (
    <div className='navbar'>
      <div className="nav-logo">
        <img src={logo} alt="" />
       
      </div>
      <img className='nav-dropdown' onClick={dropdown_toggle} src={nav_dropdown} alt="" />
      <ul ref={menuRef}className="nav-menu">
        <li onClick={()=>{setMenu("shop")}}><Link style={{textDecoration:'none'}} to='/'>Shop</Link>{menu==="shop"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("fruits")}}><Link style={{textDecoration:'none'}} to='/fruits'>Fruits</Link>{menu==="fruits"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("vegetables")}}><Link style={{textDecoration:'none'}} to='/vegetables'>Vegetables</Link>{menu==="vegetables"?<hr/>:<></>}</li>
        <li onClick={()=>{setMenu("spices")}}><Link style={{textDecoration:'none'}} to='/spices'>Spices</Link>{menu==="spices"?<hr/>:<></>}</li>
      </ul>
      <div className="nav-login-cart">
        {localStorage.getItem('auth-token')
        ?<button onClick={()=>{localStorage.removeItem('auth-token');localStorage.removeItem('user-details'); window.location.replace('/')}}>Logout</button>
        :<Link to='/login'><button>Login</button></Link>}
        <Link to='/cart'><img src={cart_icon} alt="" /></Link>
        <div className="nav-cart-count">{getTotalCartItems()}</div>
      </div>
    </div>
  )
}

export default Navbar
