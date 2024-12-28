import React from 'react'
import './Sidebar.css'
import { Link } from 'react-router-dom'
import add_product_icon from '../../assets/Product_cart.svg'
import list_product_icon from '../../assets/Product_list_icon.svg'
import sales_forecase_icon from '../../assets/Sales_Forecast.svg'


const Sidebar = () => {
  return (
    <div className='sidebar'>
      <Link to={'/addproduct'} style={{textDecoration:"none"}}>
        <div className="sidebar-item">
          <img src={add_product_icon} alt="" />
          <p>Add Product</p>
        </div>
      </Link>
      <Link to={'/listproduct'} style={{textDecoration:"none"}}>
        <div className="sidebar-item">
          <img src={list_product_icon} alt="" />
          <p>Product List</p>
        </div>
      </Link>
      <Link to={'/sales-forecast'} style={{textDecoration:"none"}}>
        <div className="sidebar-item">
          <img src={sales_forecase_icon} style={{width: "33px", height: "31px"}} alt="" />
          <p>Sales Forecasting</p>
        </div>
      </Link>
    </div>

    
  )
}

export default Sidebar
