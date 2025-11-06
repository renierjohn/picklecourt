import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { RECAPTCHA_ACTIONS } from '../config/recaptcha';
import { format, parseISO } from 'date-fns';
import { doc, getDoc, getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { v4 as uuidv4 } from 'uuid';
import firebaseConfig from '../firebase/config';
import '../styles/pages/booking-summary.scss';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export const BookingSummary = () => {
  // Parse URL parameters
  const navigate = useNavigate();
  const { courtId, date, times } = useParams();
  const { recaptchaToken, RecaptchaComponent, resetRecaptcha } = useRecaptcha(RECAPTCHA_ACTIONS.BOOKING);

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [courtData, setCourtData] = useState(null);
  const [courtOwner, setCourtOwner] = useState({ paymentMethods: [] });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentUploaded, setIsPaymentUploaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(0);
  const [userData, setUserData] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);

  const bookingDate = date ? parseISO(date) : new Date();
  const selectedTimes = times ? times.split(',') : [];
  const totalPrice = courtData ? (courtData.price * selectedTimes.length).toFixed(2) : '0.00';
  const currencySymbol = 'Php';

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: ''
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentProofChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofPreview(reader.result);
        setIsPaymentUploaded(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPaymentProof = async (file) => {
    try {
      if (!file) return null;

      // Create a unique filename for the payment proof
      const fileExt = file.name.split('.').pop();
      const fileName = `payment_proofs/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storageRef = ref(storage, fileName);

      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      throw new Error('Failed to upload payment proof. Please try again.');
    }
  };

  // Generate or get existing transaction ID from cookie
  const getOrCreateTransactionId = () => {
    // Check if transaction ID exists in cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'transaction_id') {
        return decodeURIComponent(value);
      }
    }
    // If not exists, create a new one
    const newTransactionId = `txn_${uuidv4().substring(0, 8)}`;
    // Set cookie that expires in 7 days
    const expires = new Date();
    expires.setDate(expires.getDate() + 7);
    document.cookie = `transaction_id=${encodeURIComponent(newTransactionId)};expires=${expires.toUTCString()};path=/`;
    return newTransactionId;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (selectedPaymentMethod == null) {
      setError('Please select a payment method');
      return;
    }

    if (!paymentProof && !isPaymentUploaded) {
      setError('Please upload payment proof');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);

    try {
      // Validate form
      if (!formData.fullName || !formData.email || !formData.phone) {
        throw new Error('Please fill in all required fields');
      }

      if (!selectedTimes.length) {
        throw new Error('No time slots selected');
      }

      if (!paymentProof) {
        throw new Error('Please upload payment proof');
      }

      // Upload payment proof and get URL
      const paymentProofUrl = await uploadPaymentProof(paymentProof);
      const transactionId = getOrCreateTransactionId();
      
      const bookingData = {
        transactionId, // Add transaction ID to booking data
        courtId,
        courtName: courtData?.name || 'Unknown Court',
        courtOwnerId: courtData?.userId || '',  // Owner's user ID
        date: bookingDate.toISOString(),
        times: selectedTimes,
        status: 'pending',
        paymentMethod: courtOwner?.paymentMethods?.[selectedPaymentMethod]?.name || 'Not specified',
        paymentStatus: 'pending',
        paymentProof: paymentProofUrl, // Store the uploaded payment proof URL
        paymentProofPreview: paymentProofPreview, // Keep preview for admin reference
        totalPrice: totalPrice,
        user: {
          id: userData?.uid || '',
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          ownerId: courtData?.userId || ''  // Also include ownerId in user object for easier querying
        },
        owner: {  // Add owner details for easier reference
          id: courtData?.userId || '',
          name: courtOwner?.name || 'Court Owner',
          email: courtOwner?.email || ''
        },
        notes: formData.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        recaptchaToken
      };

      // Add booking to Firestore
      await addDoc(collection(db, 'bookings'), bookingData);
      setBookingSuccess(true);
      navigate('/bookings');
    } catch (err) {
      setError(err.message || 'An error occurred while processing your booking');
      console.error('Booking error:', err);
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  }, [selectedPaymentMethod, paymentProof, isPaymentUploaded, recaptchaToken, formData, selectedTimes, courtData, courtOwner, bookingDate, navigate, resetRecaptcha]);


  // Fetch court data
  useEffect(() => {
    const fetchData = async () => {
      if (!courtId) {
        setError('Error: No court ID provided in URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courtRef = doc(db, 'courts', courtId);
        const courtDoc = await getDoc(courtRef);

        if (courtDoc.exists()) {
          const courtData = {
            id: courtDoc.id,
            ...courtDoc.data()
          };

          setCourtData(courtData);

          // Fetch court owner's information if userId exists
          if (courtData.userId) {
            try {
              const userRef = doc(db, 'users', courtData.userId);
              const userDoc = await getDoc(userRef);

              if (userDoc.exists()) {
                setCourtOwner(prev => ({
                  ...prev,
                  ...userDoc.data(),
                  paymentMethods: userDoc.data().paymentMethods || []
                }));
              }
            } catch (err) {
              console.error('Error fetching court owner data:', err);
            }
          }

          setError(null);
        } else {
          setError(`No court found with ID: ${courtId}`);
        }
      } catch (error) {
        setError(`Error loading court data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courtId]);

  if (loading) {
    return (
      <div className="booking-summary">
        <div className="container">
          <div className="loading">
            <h2>Loading Booking Information</h2>
            <p>Please wait while we load the court details...</p>
            <p>Court ID: {courtId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-summary">
        <div className="container">
          <div className="error-message">
            <h2>Error Loading Booking</h2>
            <p className="error-text">{error}</p>
            <p>Court ID: {courtId || 'Not provided'}</p>
            <p>Please try again or contact support if the problem persists.</p>
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

  if (!courtData || Object.keys(courtData).length === 0) {
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
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor" />
              </svg>
            </div>
            <h2>Booking Confirmed!</h2>
            <p>Your booking for {courtData?.name} has been confirmed. We've sent a confirmation to your email.</p>
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
                <img src={courtData?.image || '/default-court.jpg'} alt={courtData?.name || 'Court'} />
              </div>
              <div className="court-info">
                <h3>{courtData?.name || 'Court'}</h3>
                <p className="location">{courtData?.location || 'Location not specified'}</p>
                <p className="description">{courtData?.description || 'No description available.'}</p>
                <div className="payment-method">
                  <h3>Payment Method</h3>
                  <p>Select your preferred payment method for this booking</p>
                  <div className="payment-options">
                    {courtOwner.paymentMethods.map((method, index) => (
                      <label
                        key={index}
                        className={`payment-option ${selectedPaymentMethod === index ? 'selected' : ''}`}
                        onClick={() => setSelectedPaymentMethod(index)}
                      >
                        <div className="radio-container">
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={selectedPaymentMethod === index}
                            onChange={() => {}}
                          />
                          <span className="custom-radio"></span>
                          {selectedPaymentMethod === index && <span className="checkmark">✓</span>}
                        </div>

                        {method.image ? (
                          <img
                            src={method.image}
                            alt={method.name}
                            className="payment-image"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage(method.image);
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/60x40?text=' + method.name.substring(0, 2).toUpperCase();
                            }}
                            style={{ cursor: 'zoom-in' }}
                          />
                        ) : (
                          <div className="payment-image">
                            {method.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="payment-info">
                          <div className="payment-name">{method.name}</div>
                          <div className="payment-type">
                            {method.name.toLowerCase().includes('bank') ? 'Bank Transfer' :
                              method.name.toLowerCase().includes('paypal') ? 'PayPal' :
                                method.name.toLowerCase().includes('cash') ? 'Cash' : 'Payment'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="payment-method">
                    <h3>Summary</h3>
                    <div className="no-payment-methods">
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
                    <div className="detail">
                      <span>Price per hour:</span>
                      <span>{currencySymbol} {courtData?.price ? parseFloat(courtData.price).toFixed(2) : '0.00'}/hour</span>
                    </div>
                    <div className="detail-row total">
                      <span>Total Amount:</span>
                      <span>{currencySymbol} {totalPrice}</span>
                    </div>
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
                <label>Payment Proof *</label>
                <div className="file-upload-container">
                  <input
                    type="file"
                    id="payment-proof-input"
                    accept="image/*"
                    onChange={handlePaymentProofChange}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className={`upload-button ${paymentProofPreview ? 'has-preview' : ''}`}
                    onClick={() => document.getElementById('payment-proof-input').click()}
                  >
                    {paymentProofPreview ? (
                      <div className="preview-container">
                        <img src={paymentProofPreview} alt="Payment proof preview" className="preview-image" />
                        <span className="change-text">Change Image</span>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <span>Upload Payment Proof Max 1MB</span>
                        <small>Click to upload image of your payment receipt</small>
                      </div>
                    )}
                  </button>
                  {!isPaymentUploaded && (
                    <p className="upload-hint">Please upload proof of payment to complete your booking</p>
                  )}
                </div>
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

              <div className="terms">
                <label className="checkbox-container">
                  <input type="checkbox" required />
                  <span className="checkmark"></span>
                  I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Cancellation Policy</a>
                </label>
              </div>

              <div className="form-group">
                <RecaptchaComponent />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Booking'}
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
      
      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div className="image-zoom-modal" onClick={() => setZoomedImage(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setZoomedImage(null)}>×</button>
            <img src={zoomedImage} alt="Zoomed payment method" />
          </div>
        </div>
      )}
    </div>
  );
};
