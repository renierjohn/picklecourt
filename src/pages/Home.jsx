import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';
import GoogleAdsense from '../components/GoogleAdsense';
import AdScriptComponent from '../components/AdScriptComponent';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
import HeroBanner from '../components/HeroBanner';
import AiPromt from '../components/AiPromt';
import { FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaFacebookMessenger, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import PickleballNews from '../components/PickleballNews';
import '../styles/pages/home.scss';

export const Home = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [googleMap, setGoogleMap] = useState('');

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('status', '==', 1));
        const querySnapshot = await getDocs(q);
        
        const usersList = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() });
        });
        try {
          const response = await fetch(`${import.meta.env.VITE_WORKER_URL}/api/map`);
          if (response.ok) {
            const data = await response.json();
            const rawQuery = `Picklecourt postalcode${data.response.zip} ${data.response.country}`;
            const encodedQuery = data ? encodeURIComponent(rawQuery) : 'Dumaguete Pickle Court';
            const iframeSrc = `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${encodedQuery}&t=&z=10&ie=UTF8&iwloc=B&output=embed`;
            setGoogleMap(iframeSrc);
          }
        } catch (mapError) {
          console.error('Error fetching map data:', mapError);
        }
       
        setUsers(usersList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setLoading(false);
      }
    };

    fetchActiveUsers();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-animation">
          <div className="pickleball-ball"></div>
          <div className="paddle left"></div>
          <div className="paddle right"></div>
        </div>
        <p className="loading-text">Finding the best courts for you...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home">
      <HeroBanner 
        variant="home"
        backgroundImage="https://pub-786baec894f344bfa5eff4f59c6216d2.r2.dev/pickleball.png"
      />
      
      {/* Google Maps Section */}
      <section className="map-section">
        <div className="container">
          <h2 className="section-title">Find Courts Near You</h2>
          <div className="map-container">
            <iframe 
              src={googleMap}
              width="100%" 
              height="450" 
              style={{border: 0}} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Pickleball Courts in Dumaguete"
            ></iframe>
          </div>
        </div>
      </section>
      
      {/* Locations Section */}
      <section className="locations-section" id="courts-section">
        <div className="container">
          <h2 className="section-title">Book a court</h2>
          
          <div className="locations-grid">
            {users.length > 0 ? (
              users.map(user => (
                <div key={user.id} className="location-card">
                  <div className="location-image">
                    <img 
                      src={user.photoURL || 'https://via.placeholder.com/300x200?text=No+Image'}
                      alt={user.displayName || 'Court Host'} 
                    />
                  </div>
                  <div className="location-details">
                    <div className="location-header">
                      <div>
                        <h3>{user.name || 'Pickleball Court'}</h3>
                        {user.location && (
                          <div className="address">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${user.location}`} target="_blank" rel="noopener noreferrer">
                              <FaMapMarkerAlt className="icon" /> 
                              <span>{user.location}</span>
                            </a>
                          </div>
                        )}
                      </div>
                      <span className="status">Available</span>
                    </div>
                    <div className="location-features">
                      {user.phoneNumber && (
                        <span className="feature">
                          <FaPhone className="icon" />&nbsp;{user.phoneNumber}
                        </span>
                      )}
                      {user.email && (
                        <span className="feature">
                          <FaEnvelope className="icon" />
                          <a href={`mailto:${user.email}`} target="_blank" rel="noopener noreferrer">
                          &nbsp;{user.email}
                          </a>
                        </span>
                      )}
                      {user.messenger && (
                        <span className="feature">
                          <FaFacebookMessenger className="icon" />
                           <a href={`${user.messenger}`} target="_blank" rel="noopener noreferrer">
                           &nbsp;{user.messenger}
                           </a>
                        </span>
                      )}
                      {user.facebook && (
                        <span className="feature">
                          <FaFacebook className="icon" />
                           <a href={`${user.facebook}`} target="_blank" rel="noopener noreferrer">
                           &nbsp;{user.facebook}
                           </a>
                        </span>
                      )}
                      {user.twitter && (
                        <span className="feature">
                          <FaTwitter className="icon" />
                           <a href={`${user.twitter}`} target="_blank" rel="noopener noreferrer">
                           &nbsp;{user.twitter}
                           </a>
                        </span>
                      )}
                      {user.instagram && (
                        <span className="feature">
                          <FaInstagram className="icon" />
                           <a href={`${user.instagram}`} target="_blank" rel="noopener noreferrer">
                           &nbsp;{user.instagram}
                           </a>
                        </span>
                      )}
                      {user.courtType && (
                        <span className="feature">
                          <FaUser className="icon" /> {user.courtType} Court
                        </span>
                      )}
                    </div>
                      <button 
                      className="btn btn-primary"
                      onClick={() => navigate(`/book/${user.profile_id || user.id}`)}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <p>No active courts available at the moment. Please check back later.</p>
              </div>
            )}
          </div>
          <div className="manage-courts-btn">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/register')}
            >
              + Manage New Courts
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/pricing')}
              style={{ marginLeft: '1rem' }}
            >
              View Pricing
            </button>          
          </div>
        </div>
      </section>
      <section>
        <GoogleAdsense />
      </section>
      <section>
        <AiPromt />
      </section>
      <section>
        <GoogleAdsense />
        {/*<AdScriptComponent />*/}
      </section>
    </div>
  );
};
