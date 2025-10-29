import React from 'react';
import { format } from 'date-fns';
import '../styles/components/court-hero-banner.scss';

const CourtHeroBanner = ({ selectedDate, selectedTimes, courtName = 'Badminton Court' }) => {
  const formatDate = (date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatTimeRange = () => {
    if (selectedTimes.length === 0) return 'No time selected';
    
    const times = selectedTimes.sort();
    const start = times[0];
    const end = times[times.length - 1];
    
    // Assuming times are in 24h format like '09:00'
    const formatTime = (time) => {
      const [hours] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}${period}`;
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  return (
    <section className="court-hero-banner">
      <div className="court-hero-content">
        <div className="court-hero-text">
          <h1>Book Your Court</h1>
          <div className="booking-summary">
            <h2>Your Booking Summary</h2>
            <div className="summary-item">
              <span className="label">Court:</span>
              <span className="value">{courtName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Date:</span>
              <span className="value">{formatDate(selectedDate)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Time:</span>
              <span className="value">{formatTimeRange()}</span>
            </div>
            {selectedTimes.length > 0 && (
              <div className="summary-item">
                <span className="label">Duration:</span>
                <span className="value">{selectedTimes.length} hour{selectedTimes.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
        <div className="court-hero-image">
          <div className="image-overlay"></div>
        </div>
      </div>
    </section>
  );
};

export default CourtHeroBanner;
