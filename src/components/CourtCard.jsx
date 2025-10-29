import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import '../styles/components/court-card.scss';

export const CourtCard = ({ court, selectedDate, selectedTimes = [] }) => {
  const navigate = useNavigate();
  const isAvailable = court.availableSlots > 0;
  
  return (
    <div className="court-card">
      <div className="court-image">
        <img src={court.image} alt={court.name} />
        {!isAvailable && <div className="fully-booked">Fully Booked</div>}
      </div>
      <div className="court-details">
        <h3 className="court-name">{court.name}</h3>
        <p className="court-location">{court.location}</p>
        <div className="court-availability">
          <span className={`status ${isAvailable ? 'available' : 'unavailable'}`}>
            {isAvailable ? `${court.availableSlots} slots available` : 'No slots available'}
          </span>
        </div>
        <div className="booking-info">
          <span className="date">{format(selectedDate, 'MMM d, yyyy')}</span>
          <span className="time">{selectedTimes.join(', ')}</span>
        </div>
        <div className="court-actions">
          <button 
            className={`btn ${!isAvailable || selectedTimes.length === 0 ? 'disabled' : ''}`}
            onClick={() => {
              if (isAvailable && selectedTimes.length > 0) {
                const dateStr = format(selectedDate, 'yyyy-MM-dd');
                const timesStr = selectedTimes.join(',');
                navigate(`/book/${court.id}/${dateStr}/${timesStr}`);
              }
            }}
            disabled={!isAvailable || selectedTimes.length === 0}
          >
            {selectedTimes.length > 0 
              ? `Book ${selectedTimes.length} Slot${selectedTimes.length > 1 ? 's' : ''}`
              : 'Select Time'}
          </button>
        </div>
      </div>
    </div>
  );
};
