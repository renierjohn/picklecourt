import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/hero-banner.scss';

const HeroBanner = () => {
  const navigate = useNavigate();
  
  const handleBookNow = () => {
    // Scroll to the courts section
    const courtsSection = document.getElementById('courts-section');
    if (courtsSection) {
      courtsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-banner">
      <div className="hero-content">
        <h1>Book Your Court Online</h1>
        <p>Reserve your perfect time slot and enjoy a great game with friends and family</p>
        <button 
          className="btn btn-primary"
          onClick={handleBookNow}
        >
          Book Now
        </button>
      </div>
    </section>
  );
};

export default HeroBanner;
