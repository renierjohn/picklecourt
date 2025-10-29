import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, isToday, isWeekend, isSameDay } from 'date-fns';
import { CourtCard } from '../components/CourtCard';
import HeroBanner from '../components/HeroBanner';
import '../styles/pages/home.scss';

 // Court data - availableSlots will be calculated based on selected time
const courts = [
  {
    id: 1,
    name: 'Court 1',
    location: 'Main Building',
    image: 'https://placehold.co/600x400/4285F4/FFFFFF?text=Court+1',
    maxSlots: 4,
  },
  {
    id: 2,
    name: 'Court 2',
    location: 'Outdoor Area',
    image: 'https://placehold.co/600x400/34A853/FFFFFF?text=Court+2',
    maxSlots: 5,
  },
  {
    id: 3,
    name: 'Court 3',
    location: 'Sports Complex',
    image: 'https://placehold.co/600x400/EA4335/FFFFFF?text=Court+3',
    maxSlots: 6,
  },
];

// Sample booking data - in a real app, this would come from an API
const sampleBookings = [
  {
    id: 1,
    courtId: 1,
    date: '2025-10-21',
    times: ['10:00', '11:00', '13:00'] // Specific time slots that are booked
  },
  {
    id: 10,
    courtId: 1,
    date: '2025-11-22',
    times: ['08:00', '09:00', '11:00'] // Specific time slots that are booked
  },
  {
    id: 2,
    courtId: 2,
    date: '2025-11-03',
    times: ['14:00', '15:00']
  },
  {
    id: 3,
    courtId: 1,
    date: '2025-10-20',
    times: ['14:00', '15:00']
  },
  {
    id: 4,
    courtId: 2,
    date: '2025-11-02',
    times: ['14:00', '15:00']
  },
];

export const Courts = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [bookings] = useState(sampleBookings); // In a real app, this would be fetched from an API
  
  // Set the first court as selected by default
  useState(() => {
    if (courts.length > 0 && !selectedCourt) {
      setSelectedCourt(courts[0].id);
    }
  }, []);

  // Check if a time slot is during lunch break (12:00 - 13:00)
  const isLunchBreak = (time24) => {
    const [hour] = time24.split(':').map(Number);
    return hour === 12; // 12:00 to 12:59 is lunch break
  };

  // Check if a time slot is booked for the selected court
  const isTimeSlotBooked = (date, time24) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if this time is in any booking's times array for the selected court and date
    return bookings.some(booking => {
      // Skip if not the same date or not for the selected court
      if (booking.date !== dateStr || booking.courtId !== selectedCourt) return false;
      
      // Check if the time24 is in the booking's times array
      return booking.times.includes(time24);
    });
  };
  // Get available slots for the selected court at a specific time
  const getAvailableSlots = (date, time24) => { 
    if (!time24 || selectedCourt === null) return 0; // If no time or court is selected, show 0 available slots
    
    const court = courts.find(c => c.id === selectedCourt);
    if (!court) return 0;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const [hour, minute] = time24.split(':').map(Number);
    const selectedDateTime = new Date(date);
    selectedDateTime.setHours(hour, minute, 0, 0);
    
    // Count overlapping bookings for this court and time
    const overlappingBookings = bookings.filter(booking => {
      if (booking.courtId !== selectedCourt || booking.date !== dateStr) return false;
      
      const [bookHour, bookMinute] = booking.time.split(':').map(Number);
      const bookingStart = new Date(selectedDateTime);
      bookingStart.setHours(bookHour, bookMinute, 0, 0);
      
      const bookingEnd = new Date(bookingStart);
      bookingEnd.setHours(bookingStart.getHours() + booking.duration);
      
      return selectedDateTime < bookingEnd && 
             selectedDateTime.getTime() + (60 * 60 * 1000) > bookingStart.getTime();
    });
    
    return Math.max(0, court.maxSlots - overlappingBookings.length);
  };
  
  const toggleTimeSlot = (time24) => {
    setSelectedTimes(prev => 
      prev.includes(time24) 
        ? prev.filter(t => t !== time24)
        : [...prev, time24].sort()
    );
  };

  // Format time to 12-hour with AM/PM
  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Generate time slots from 8 AM to 8 PM in 24-hour format
  const timeSlots24 = Array.from({ length: 13 }, (_, i) => {
    const hour = 8 + i;
    return `${hour.toString().padStart(2, '0')}:00`;
  });
  
  // Convert to 12-hour format for display
  const timeSlots = timeSlots24.map(time24 => ({
    display: formatTime(time24),
    value: time24 // Keep original value for calculations
  }));


  // Generate dates for the next 2 months (current month + next month)
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Last day of next month
  const days = [];
  
  // Add all dates from today to end of next month
  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  return (
    <div className="courts">
      <HeroBanner />
      <section className="calendar-section">
        <div className="container">
          <h1 className="section-title">Book a Court</h1>
          <div className="date-selector">
            {days.map((day) => {
              const dayOfWeek = format(day, 'EEE');
              const dayOfMonth = format(day, 'd');
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <button
                  key={day.toString()}
                  className={`date-button ${isSelected ? 'selected' : ''} ${
                    isWeekend(day) ? 'weekend' : ''
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="day">{dayOfWeek}</span>
                  <span className={`date ${isToday(day) ? 'today' : ''}`}>
                    {dayOfMonth}
                  </span>
                </button>
              );
            })}
          </div>
          
          <div className="time-slots">
            <div className="time-slots-grid">
              {timeSlots.map(({ display, value: time24 }) => {
                const isLunch = isLunchBreak(time24);
                const isBooked = isTimeSlotBooked(selectedDate, time24);
                const isSelected = selectedTimes.includes(time24);
                
                return (
                  <button
                    key={time24}
                    className={`time-slot ${isSelected ? 'selected' : ''} ${
                      isBooked ? 'booked' : ''
                    } ${isLunch ? 'lunch-break' : ''}`}
                    onClick={() => !isBooked && toggleTimeSlot(time24)}
                    disabled={isBooked}
                    title={isLunch ? 'Lunch Break (12:00 PM - 1:00 PM)' : isBooked ? 'This time slot is already booked' : ''}
                  >
                    {isLunch ? 'Lunch Break' : display}
                    {isBooked && !isLunch && <span className="booked-badge">Booked</span>}
                    {isLunch && <span className="lunch-badge">Closed</span>}
                  </button>
                );
              })}
            </div>
            {selectedTimes.length > 0 && (
              <div className="selected-times">
                <h4>Selected Times:</h4>
                <div className="selected-times-list">
                  {selectedTimes.map(time24 => {
                    const timeDisplay = timeSlots.find(t => t.value === time24)?.display || time24;
                    return (
                      <span key={time24} className="selected-time-tag">
                        {timeDisplay}
                        <button 
                          className="remove-time"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTimes(prev => prev.filter(t => t !== time24));
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="courts-section" className="courts-section">
        <div className="container">
          <h2 className="section-title">Select a Court</h2>
          <div className="courts-grid">
            {courts.map((court) => (
              <div 
                key={court.id} 
                className={`court-selection ${selectedCourt === court.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedCourt(court.id);
                  setSelectedTimes([]); // Reset selected times when changing court
                }}
              >
                <div className="court-image">
                  <img src={court.image} alt={court.name} />
                </div>
                <div className="court-info">
                  <h3>{court.name}</h3>
                  <p>{court.location}</p>
                  <div className="court-availability">
                    <span className="slots">Max Slots: {court.maxSlots}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedCourt && (
            <div className="selected-court-info">
              <h3>Booking for: {courts.find(c => c.id === selectedCourt)?.name}</h3>
              <p>Select your preferred date and time slots above.</p>
              {selectedTimes.length > 0 && (
                <div className="booking-summary">
                  <h4>Your Selection:</h4>
                  <ul>
                    {selectedTimes.map(time => (
                      <li key={time}>
                        {format(selectedDate, 'MMMM d, yyyy')} at {formatTime(time)}
                        <button 
                          className="remove-time"
                          onClick={() => setSelectedTimes(prev => prev.filter(t => t !== time))}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button 
                    className="book-now-button"
                    onClick={() => {
                      const selectedCourtData = courts.find(c => c.id === selectedCourt);
                      const dateStr = format(selectedDate, 'yyyy-MM-dd');
                      const timesStr = selectedTimes.join(',');
                      
                      navigate(`/booking-summary/${selectedCourt}/${dateStr}/${timesStr}`, {
                        state: {
                          court: selectedCourtData,
                          date: selectedDate,
                          times: selectedTimes
                        }
                      });
                    }}
                  >
                    Book Now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
