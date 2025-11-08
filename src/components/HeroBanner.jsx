import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/hero-banner.scss';
import { useAuth } from '../contexts/AuthContext';
import { FaFacebookMessenger } from 'react-icons/fa';



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
  
  const handleMessengerClick = () => {
    window.open('http://m.me/pickleball.courts.renify', '_blank');
  };

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
              {user?.user === null && (
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
                <button 
                  className="btn-messenger"
                  onClick={handleMessengerClick}
                  aria-label="Chat with us on Messenger"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#4a90e2',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                    },
                    '&:active': {
                      transform: 'translateY(1px)',
                      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  <FaFacebookMessenger className="messenger-icon" />
                  Contact Us
                </button>
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
