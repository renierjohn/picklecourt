import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase/config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
import HeroBanner from '../components/HeroBanner';
import { FaMapMarkerAlt, FaUser, FaPhone, FaEnvelope, FaTableTennis, FaMap } from 'react-icons/fa';
import PickleballNews from '../components/PickleballNews';
import '../styles/pages/home.scss';

export const Home = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      {/* Locations Section */}
      <section className="locations-section" id="courts-section">
        <div className="container">
          <h2 className="section-title">Book a court with our verified hosts</h2>
          
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
                          <FaEnvelope className="icon" /> &nbsp;{user.email}
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
        </div>
      </section>
      
    </div>
  );
};
