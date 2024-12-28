import React from 'react'
import './Hero.css'
import gro_icon from '../Assets/gro_icon.png'
import arrow_icon from '../Assets/arrow.png'
import hero_image from '../Assets/hero_image.png'

const Hero = () => {
  return (
    <div className='hero'>
      <div className="hero-left">
        <h1>STEP UP TO BETTER FOOD</h1>
        <div>
            <div className="hero-hand-icon">
                <p>Fresh</p>
                <img src={gro_icon} alt=""/>
            </div>
            <p>Products</p>
            <p>For Everyone</p>
      </div>
      <div className="hero-latest-btn">
            <div>Buy Now</div>
            <img src={arrow_icon} alt="" />
        </div>
      </div>
      <div className="hero-right">
          <img src={hero_image} alt="" />
      </div>
    </div>
  )
}

export default Hero
