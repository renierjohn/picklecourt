import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format, addDays, isToday, isWeekend, isSameDay, parseISO } from 'date-fns';
import { getFirestore, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';
import { initializeApp } from 'firebase/app';
import { CourtCard } from '../components/CourtCard';
import HeroBanner from '../components/HeroBanner';
import '../styles/pages/home.scss';

// Court data will be fetched from Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const Courts = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPhoto, setUserPhoto] = useState(null);

  // Fetch courts data from Firestore
  useEffect(() => {
    if (!bookings) return;
    
    // Subscribe to courts collection
    const bookingQuery = query(
      collection(db, 'bookings'),
      where('courtId', '==', selectedCourt),
      where('status', '==', 'confirmed')
    );
    
    const unsubscribeBookings = onSnapshot(bookingQuery, (snapshot) => {
      const bookingsData = [];
      
      snapshot.forEach((doc) => {
        const bookingsDoc = { id: doc.id, ...doc.data() };
        bookingsData.push(bookingsDoc);
      });
      setBookings(bookingsData);
    });
    
    return () => unsubscribeBookings();
  }, [selectedCourt]);
  
  // Fetch user ID by profile_id and then fetch their courts
  useEffect(() => {    
    const fetchUserAndCourts = async () => {
      try {
        setLoading(true);
        
        // First, find the user with the matching profile_id
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('profile_id', '==', userId));
        const userSnapshot = await getDocs(userQuery);
        
        if (userSnapshot.empty) {
          throw new Error('No user found with this profile ID');
        }
        
        // Get the user document
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        setUserPhoto(userData.photoURL || null);
        const actualUserId = userDoc.id; // This is the actual user ID we'll use to filter courts
        
        // Now fetch courts for this user
        const courtsRef = collection(db, 'courts');
        const q = query(courtsRef, where('userId', '==', actualUserId));
        const querySnapshot = await getDocs(q);
        
        const courtsList = [];
        querySnapshot.forEach((doc) => {
          const courtData = { id: doc.id, ...doc.data() };
          courtsList.push(courtData);
        });
 
        setCourts(courtsList);
        
        // Set the first court as selected if available
        if (courtsList.length > 0) {
          setSelectedCourt(courtsList[0].id);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load courts. Please try again later.');
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserAndCourts();
    } else {
      setError('No user specified. Please check the URL.');
      setLoading(false);
    }
  }, [userId]);

  // Update error handling in the error state UI
  if (error) {
    return (
      <div className="home">
        <HeroBanner backgroundImage={userPhoto} />
        <div className="container">
          <div className="error">
            <h3>Error Loading Courts</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: '#f0f2f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          overflow: 'hidden',
          border: '3px solid #e9ecef',
          position: 'relative'
        }}>
          <div className="profile-image-loader" style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #f0f2f5 25%, #e9ecef 50%, #f0f2f5 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            borderRadius: '50%'
          }} />
        </div>
        <h3 style={{
          margin: '1rem 0 0.5rem',
          color: '#333',
          fontWeight: '600'
        }}>Loading Courts</h3>
        <p style={{
          color: '#666',
          margin: '0',
          fontSize: '0.95rem'
        }}>Please wait while we load the available courts...</p>
        <style>{
          `@keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }`
        }</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <HeroBanner backgroundImage={userPhoto} />
        <div className="container">
          <div className="error">
            <h3>Error Loading Courts</h3>
            <p>{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (courts.length === 0) {
    return (
      <div className="home">
        <HeroBanner backgroundImage={userPhoto} />
        <div className="container">
          <div className="no-courts">
            <p>No courts found for this user.</p>
          </div>
        </div>
      </div>
    );
  }

  // Check if a time slot is during lunch break (12:00 - 13:00)
  const isLunchBreak = (time24) => {
    const [hour] = time24.split(':').map(Number);
    return hour === 12; // 12:00 to 12:59 is lunch break
  };
  
  // Check if a time slot is marked as unavailable in court settings
  const isTimeUnavailable = (time24) => {
    if (!selectedCourt) return false;
    const court = courts.find(c => c.id === selectedCourt);
    if (!court) return false;
    
    // Check general unavailable hours
    if (court.unavailableHours?.includes(time24)) {
      return true;
    }
    
    // Check day-specific unavailable hours
    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
    if (court.daySpecificUnavailableHours?.[dayOfWeek]?.includes(time24)) {
      return true;
    }
    
    return false;
  };

  // Check if a time slot is booked for the selected court
  const isTimeSlotBooked = (date, time24) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const court = courts.find(c => c.id === selectedCourt);
    if (!court) return false;
    
    // Check if this time is in the court's unavailableHours
    if (court.unavailableHours?.includes(time24)) {
      return true;
    }
    
    // Check day-specific unavailable hours
    const dayOfWeek = format(date, 'EEEE').toLowerCase();
    if (court.daySpecificUnavailableHours?.[dayOfWeek]?.includes(time24)) {
      return true;
    }
 
    // Check if this time is in any booking's times array for the selected court and date
    return bookings.some(booking => {
      // Skip if not the same date or not for the selected court  
      if (formatDate(booking.date) !== dateStr || booking.courtId !== selectedCourt) return false;
      // console.log(selectedCourt, time24, booking.times, booking.times.includes(time24))
      // Check if the time24 is in the booking's times array
      return booking.times.includes(time24);
    });
  };

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'yyyy-MM-dd');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Check if a day is fully booked or marked as unavailable
  const isDayFullyBooked = (date) => {
    if (!selectedCourt) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = format(date, 'EEEE').toLowerCase(); // e.g., 'monday', 'tuesday', etc.
    const court = courts.find(c => c.id === selectedCourt);
    
    if (!court) return false;
    
    // Check if the day is marked as unavailable in court settings
    if (Array.isArray(court.unavailableDays) && court.unavailableDays.includes(dayOfWeek)) {
      return true;
    }
    
    // Check for specific unavailable dates if they exist
    if (Array.isArray(court.unavailableDates) && court.unavailableDates.includes(dateStr)) {
      return true;
    }
    
    // Get all bookings for this court and date
    const dayBookings = bookings.filter(
      booking => booking.courtId === selectedCourt && booking.date === dateStr
    );
    
    // If no bookings, the day is not fully booked
    if (dayBookings.length === 0) return false;
    
    // Flatten all booked times for the day
    const allBookedTimes = dayBookings.flatMap(booking => booking.times);
    
    // Check if all available time slots are booked
    return timeSlots24.every(time24 => 
      allBookedTimes.includes(time24) || isLunchBreak(time24)
    );
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
    return `${hours12}:${minutes.toString().padStart(2, '0')}${period}`;
  };

  // Generate time slots from 5 AM to 12 AM in 24-hour format with 1-hour gaps
  const timeSlots24 = Array.from({ length: 19 }, (_, i) => {
    const startHour = 5 + i;
    const endHour = 6 + i;
    return {
      start: `${startHour.toString().padStart(2, '0')}:00`,
      end: `${endHour.toString().padStart(2, '0')}:00`
    };
  });

  // Convert to display format with time ranges
  const timeSlots = timeSlots24.map(slot => {
    const startTime = formatTime(slot.start);
    const endTime = formatTime(slot.end);
    return {
      display: `${startTime} - ${endTime}`,
      value: slot.start, // Use start time as the value for compatibility
      start: slot.start,
      end: slot.end
    };
  });
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
      <HeroBanner backgroundImage={userPhoto} />

            <section id="courts-section" className="courts-section">
        <div className="container">
          <h2 className="section-title">Select a Court</h2>
          <div className="courts-grid">
            {courts.length === 0 ? (
              <div className="no-courts">
                <p>No courts found for this user.</p>
                <p>Please check back later or contact support if you believe this is an error.</p>
              </div>
            ) : courts.map((court) => (
              <div 
                key={court.id} 
                className={`court-selection ${selectedCourt === court.id ? 'selected' : ''} ${
                  court.status === 'maintenance' ? 'under-maintenance' : ''
                }`}
                onClick={() => {
                  if (court.status !== 'maintenance') {
                    setSelectedCourt(court.id);
                    setSelectedTimes([]); // Reset selected times when changing court
                  }
                }}
              >
                <div className="court-image">
                  <img 
                    src={court.image} 
                    alt={court.name} 
                    style={court.status === 'maintenance' ? { opacity: 0.6 } : {}} 
                  />
                  {court.status === 'maintenance' && (
                    <div className="maintenance-overlay">
                      <span className="maintenance-badge">Under Maintenance</span>
                    </div>
                  )}
                </div>
                <div className="court-info">
                  <h3>
                    {court.name}
                    {court.status === 'maintenance' && (
                      <span className="maintenance-tag">Maintenance</span>
                    )}
                  </h3>
                  <p>{court.location}</p>
                  <div className="court-availability">
                    {court.status === 'maintenance' ? (
                      <span className="maintenance-message">
                        Currently unavailable for booking
                      </span>
                    ) : (
                      <span className="slots">Php {court.price}</span>
                    )}
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
                    disabled={courts.find(c => c.id === selectedCourt)?.status === 'maintenance'}
                    onClick={() => {
                      const selectedCourtData = courts.find(c => c.id === selectedCourt);
                      if (selectedCourtData?.status === 'maintenance') return;
                      
                      const dateStr = format(selectedDate, 'yyyy-MM-dd');
                      const timesStr = selectedTimes.join(',');
                      
                      navigate(`/booking-summary/${selectedCourt}/${dateStr}/${timesStr}`, {
                        state: {
                          court: selectedCourtData,
                          date: selectedDate,
                          times: selectedTimes,
                          userId: userId
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
      
      <section className="calendar-section">
        <div className="container">
          <h1 className="section-title">Book a Court</h1>
          <div className="date-selector">
            {days.map((day) => {
              const dayOfWeek = format(day, 'EEE');
              const dayOfMonth = format(day, 'd');
              const isSelected = isSameDay(day, selectedDate);
              const isUnavailable = isDayFullyBooked(day);
              const dayName = format(day, 'EEEE').toLowerCase();
              const court = courts.find(c => c.id === selectedCourt);
              const isDayUnavailable = court?.unavailableDays?.includes(dayName);
              
              return (
                <button
                  key={day.toString()}
                  className={`date-button ${isSelected ? 'selected' : ''} ${
                    isWeekend(day) ? 'weekend' : ''
                  } ${isUnavailable ? 'unavailable' : ''} ${isDayUnavailable ? 'unavailable' : ''}`}
                  onClick={() => !isUnavailable && !isDayUnavailable && setSelectedDate(day)}
                  disabled={isUnavailable || isDayUnavailable}
                  title={isDayUnavailable ? 'This day is not available for booking' : isUnavailable ? 'This day is fully booked' : ''}
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
              {timeSlots.map(({ display, value: time24, start, end }) => {
                // Check if any time within the range is unavailable
                const isLunch = isLunchBreak(start);
                const isUnavailable = isTimeUnavailable(start);
                const isBooked = isTimeSlotBooked(selectedDate, start) && !isUnavailable;
                const isSelected = selectedTimes.includes(time24);
                const court = courts.find(c => c.id === selectedCourt);
                
                return (
                  <button
                    key={time24}
                    className={`time-slot ${isSelected ? 'selected' : ''} ${
                      isBooked ? 'booked' : ''
                    } ${isLunch ? 'lunch-break' : ''} ${isUnavailable ? 'unavailable' : ''}`}
                    onClick={() => !isBooked && !isUnavailable && toggleTimeSlot(time24)}
                    disabled={isBooked || isUnavailable}
                    title={
                      isLunch ? 'Lunch Break (12:00 PM - 1:00 PM)' : 
                      isUnavailable ? 'This time slot is not available for booking' :
                      isBooked ? 'This time slot is already booked' : ''
                    }
                  >
                    {isLunch ? 'Lunch Break' : display}
                    {isBooked && !isLunch && !isUnavailable && <span className="booked-badge">Booked</span>}
                    {isUnavailable && !isLunch && (
                      <span className="unavailable-badge">
                        {court?.daySpecificUnavailableHours?.[format(selectedDate, 'EEEE').toLowerCase()]?.includes(time24) 
                          ? 'Unavailable' 
                          : 'Unavailable'}
                      </span>
                    )}
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
    </div>
  );
};
