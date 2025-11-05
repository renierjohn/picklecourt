import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/hero-banner.scss';
import { useAuth } from '../contexts/AuthContext';


const HeroBanner = ({ backgroundImage, variant = 'default' }) => {
  const isHomeVariant = variant === 'home';
  const user = useAuth();  
  const bannerStyle = {
    backgroundImage: backgroundImage 
      ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`
      : 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7))',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: isHomeVariant ? '400px' : '250px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease-in-out',
    backgroundAttachment: isHomeVariant ? 'fixed' : 'scroll'
  };
  const navigate = useNavigate();
  
  const handleBookNow = () => {
    // Scroll to the courts section
    const courtsSection = document.getElementById('courts-section');
    if (courtsSection) {
      courtsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBecomeHost = () => {
    navigate('/register');
  };

  return (
    <section className={`hero-banner ${isHomeVariant ? 'home-variant' : ''}`} style={bannerStyle}>
      <div className="hero-content">
        {isHomeVariant ? (
          <>
            <h1>Welcome to PickleCourt</h1>
            <p className="lead">Your premier destination for booking pickleball courts and connecting with players</p>
            <div className="cta-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleBookNow}
              >
                Find a Court
              </button>
              {!user && (
                <button 
                  className="btn btn-secondary"
                  onClick={handleBecomeHost}
                >
                  Become a Host
                </button>
              )}
            </div>
            <p className="features">
              <span>Easy Booking</span>
              <span>Real-time Availability</span>
            </p>
          </>
        ) : (
          <>
            <h1>Book Your Court Online</h1>
            <p>Reserve your perfect time slot and enjoy a great game with friends and family</p>
            <button 
              className="btn btn-primary"
              onClick={handleBookNow}
            >
              Book Now
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroBanner;
