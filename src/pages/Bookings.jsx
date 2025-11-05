import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { collection, query, where, getDocs, getFirestore, orderBy } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import firebaseConfig from '../firebase/config';
import { getAuth } from 'firebase/auth';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaReceipt, FaTimes } from 'react-icons/fa';
import '../styles/pages/bookings.scss';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const navigate = useNavigate();

  const handleImageClick = (imageUrl) => {
    setZoomedImage(imageUrl);
    document.body.style.overflow = 'hidden';
  };

  const closeZoomedImage = () => {
    setZoomedImage(null);
    document.body.style.overflow = 'auto';
  };

  // Get transaction ID from cookie
  const getTransactionId = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'transaction_id') {
        return decodeURIComponent(value);
      }
    }
    return null;
  };

  // Set transaction ID in cookie
  const setTransactionId = (id) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // Expires in 7 days
    document.cookie = `transaction_id=${encodeURIComponent(id)};expires=${expires.toUTCString()};path=/`;
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const transactionId = getTransactionId();
        
        if (!transactionId) {
          setBookings([]);
          setLoading(false);
          return;
        }

        // First, try with the exact transactionId
        let q = query(
          collection(db, 'bookings'),
          where('transactionId', '==', transactionId)
        );

        let querySnapshot = await getDocs(q);
        
        // If no results, try with user ID from the transaction ID
        if (querySnapshot.empty) {
          // Assuming transactionId is in format 'txn_<userid>_<random>'
          const userIdMatch = transactionId.match(/txn_([^_]+)/);
          if (userIdMatch && userIdMatch[1]) {
            const userId = userIdMatch[1];
            
            // Try querying with user ID
            q = query(
              collection(db, 'bookings'),
              where('user.id', '==', userId),
              orderBy('createdAt', 'desc')
            );
            
            querySnapshot = await getDocs(q);
          }
        }
        
        // If still no results, try getting all bookings and filtering client-side
        if (querySnapshot.empty) {
          const allBookingsQuery = query(collection(db, 'bookings'));
          const allBookingsSnapshot = await getDocs(allBookingsQuery);
          
          // Try to find matching bookings by transactionId or user ID
          const matchingBookings = allBookingsSnapshot.docs.filter(doc => {
            const data = doc.data();
            return (
              data.transactionId === transactionId ||
              (data.user && data.user.id === transactionId) ||
              (data.transactionId && data.transactionId.includes(transactionId)) ||
              (data.user && data.user.id && data.user.id.includes(transactionId))
            );
          });
          
          // Update the query snapshot with matching bookings
          querySnapshot = {
            docs: matchingBookings,
            empty: matchingBookings.length === 0,
            forEach: (callback) => matchingBookings.forEach(callback)
          };
        }
        
        const bookingsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Case-insensitive comparison
          if (data.transactionId && 
              typeof data.transactionId === 'string' && 
              data.transactionId.toLowerCase() === transactionId.toLowerCase()) {
            bookingsData.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        setBookings(bookingsData);
        setError(null);

      } catch (err) {
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatTime = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <div className="bookings">
        <div className="container">
          <h1>My Bookings</h1>
          <div className="loading">
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookings">
        <div className="container">
          <h1>My Bookings</h1>
          <div className="error">
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

  return (
    <div className="bookings">
      <div className="container">
        <h1>My Bookings</h1>
        
        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>You don't have any bookings yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/')}
            >
              Book a Court
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <h3>{booking.courtName}</h3>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
                  </span>
                </div>
                
                <div className="booking-details">
                  <div className="detail">
                    <FaCalendarAlt className="icon" />
                    <span>{formatDate(booking.date)}</span>
                  </div>
                  <div className="detail">
                    <FaClock className="icon" />
                    <span>
                      {booking.times && booking.times.length > 0 
                        ? `${formatTime(booking.times[0])} - ${formatTime(
                            booking.times[booking.times.length - 1].split(':')[0] + 
                            ':' + 
                            (parseInt(booking.times[0].split(':')[1]) + 60).toString().padStart(2, '0')
                          )}` 
                        : 'No time selected'}
                    </span>
                  </div>
                  <div className="detail">
                    <FaMapMarkerAlt className="icon" />
                    <span>{booking.owner.name}</span>
                  </div>
                  <div className="detail">
                    <FaUser className="icon" />
                    <span>Name: {booking.user.name || 'N/A'}</span>
                  </div>
                  <div className="detail">
                    <FaEnvelope className="icon" />
                    <span>{booking.user.email || 'N/A'}</span>
                  </div>
                  <div className="detail">
                    <FaPhone className="icon" />
                    <span>{booking.user.phone || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="booking-footer">
                  <div className="price">
                    Total: Php {Number(booking.totalPrice || 0).toFixed(2)}
                  </div>
                  {booking.paymentProof && (
                    <div className="payment-proof">
                      <div className="payment-proof-label">Payment Proof:</div>
                      <img 
                        src={booking.paymentProof} 
                        alt="Payment proof" 
                        className="payment-proof-thumbnail"
                        onClick={() => handleImageClick(booking.paymentProof)}
                      />
                    </div>
                  )}
                 
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div className="zoomed-image-modal" onClick={closeZoomedImage}>
          <div className="zoomed-image-container" onClick={e => e.stopPropagation()}>
            <button className="close-zoom" onClick={closeZoomedImage}>
              <FaTimes />
            </button>
            <img src={zoomedImage} alt="Payment proof" className="zoomed-image" />
          </div>
        </div>
      )}
    </div>
  );
};
