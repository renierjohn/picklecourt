import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addHours } from 'date-fns';
import '../styles/pages/booking-summary.scss';

// Mock data for the court
const courtData = {
  1: {
    id: 1,
    name: 'Court 1',
    location: 'Main Building',
    image: 'https://placehold.co/800x400/4285F4/FFFFFF?text=Court+1',
    price: 25,
    description: 'Indoor court with professional-grade surface and lighting. Perfect for both casual and competitive play.'
  },
  2: {
    id: 2,
    name: 'Court 2',
    location: 'Outdoor Area',
    image: 'https://placehold.co/800x400/34A853/FFFFFF?text=Court+2',
    price: 20,
    description: 'Outdoor court with beautiful surroundings. Enjoy fresh air while playing your favorite sport.'
  },
  3: {
    id: 3,
    name: 'Court 3',
    location: 'Sports Complex',
    image: 'https://placehold.co/800x400/EA4335/FFFFFF?text=Court+3',
    price: 30,
    description: 'Premium indoor court with professional setup and amenities. Ideal for tournaments and serious players.'
  }
};

export const BookingSummary = () => {
  const { courtId, date, times } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Parse URL parameters
  const bookingDate = date ? parseISO(date) : new Date();
  const selectedTimes = times ? times.split(',') : [];
  
  // Format time slots for display
  const formatTimeSlots = () => {
    if (selectedTimes.length === 0) return 'No time selected';
    
    // If only one time slot
    if (selectedTimes.length === 1) {
      const [start] = selectedTimes[0].split(':');
      const endTime = `${parseInt(start) + 1}:00`;
      return `${selectedTimes[0]} - ${endTime}`;
    }
    
    // If multiple time slots, show first and last time
    const firstTime = selectedTimes[0];
    const lastTime = selectedTimes[selectedTimes.length - 1];
    const [lastHour] = lastTime.split(':');
    const endTime = `${parseInt(lastHour) + 1}:00`;
    
    return `${firstTime} - ${endTime} (${selectedTimes.length} slots)`;
  };

  // Get court data based on the ID from URL
  const court = courtData[courtId];
  
  // Calculate total price
  const totalPrice = court ? (court.price * selectedTimes.length).toFixed(2) : '0.00';
  const currencySymbol = 'Php';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // console.log('Booking submitted:', { court, formData, bookingDate, bookingTime });
      setIsLoading(false);
      setBookingSuccess(true);
      
      setTimeout(() => {
        navigate('/');
      }, 3000);
    }, 1500);
  };

  if (!court) {
    return (
      <div className="booking-summary">
        <div className="container">
          <div className="not-found">
            <h2>Court not found</h2>
            <p>The court you're looking for doesn't exist or has been removed.</p>
            <button onClick={() => navigate('/')} className="back-button">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="booking-summary">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
              </svg>
            </div>
            <h2>Booking Confirmed!</h2>
            <p>Your booking for {court.name} has been confirmed. We've sent a confirmation to your email.</p>
            <button onClick={() => navigate('/')} className="back-button">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-summary">
      <div className="container">
        <h1 className="page-title">Complete Your Booking</h1>
        
        <div className="booking-container">
          <div className="booking-details">
            <h2>Booking Summary</h2>
            <div className="court-card">
              <div className="court-image">
                <img src={court.image} alt={court.name} />
              </div>
              <div className="court-info">
                <h3>{court.name}</h3>
                <p className="location">{court.location}</p>
                <p className="description">{court.description}</p>
                
                <div className="booking-details">
                  <h3>Booking Details</h3>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span>{format(bookingDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Time Slots:</span>
                    <div className="time-slots-summary">
                      {selectedTimes.map((time, index) => {
                        const [hour] = time.split(':');
                        const endTime = `${parseInt(hour) + 1}:00`;
                        return (
                          <div key={index} className="time-slot">
                            {time} - {endTime}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total Duration:</span>
                    <span>{selectedTimes.length} hour{selectedTimes.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="detail-row total">
                    <span>Total Amount:</span>
                    <span>{currencySymbol} {totalPrice}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="booking-form-container">
            <h2>Your Information</h2>
            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="John Doe"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="you@example.com"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="(123) 456-7890"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Special Requests (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Any special requests or notes for your booking..."
                />
              </div>
              
              <div className="payment-method">
                <h3>Payment Method</h3>
                <div className="payment-options">
                  <label className="payment-option">
                    <input type="radio" name="payment" defaultChecked />
                    <span>Credit/Debit Card</span>
                  </label>
                  <label className="payment-option">
                    <input type="radio" name="payment" />
                    <span>PayPal</span>
                  </label>
                </div>
                
                <div className="card-details">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input type="text" placeholder="1234 5678 9012 3456" />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input type="text" placeholder="MM/YY" />
                    </div>
                    
                    <div className="form-group">
                      <label>CVV</label>
                      <input type="text" placeholder="123" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="terms">
                <label className="checkbox-container">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Cancellation Policy</a>
                </label>
              </div>
              
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? 'Processing...' : `Pay Php ${court.price}.00 & Confirm Booking`}
              </button>
              
              <p className="secure-payment">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"></path>
                </svg>
                Secure payment. Your information is encrypted.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
