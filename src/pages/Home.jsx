import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import HeroBanner from '../components/HeroBanner';
import { FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/pages/home.scss';

// Locations data
const locations = [
  {
    id: 1,
    name: 'Sunset Pickleball Courts',
    address: '123 Sports Complex Drive',
    city: 'Metro Manila',
    distance: '2.5 km away',
    image: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80',
    phone: '(02) 8123 4567',
    hours: [
      'Monday - Friday: 6:00 AM - 10:00 PM',
      'Saturday - Sunday: 7:00 AM - 9:00 PM',
      'Holidays: 8:00 AM - 8:00 PM'
    ],
    amenities: [
      '6 Professional Pickleball Courts',
      'LED Lighting for Night Play',
      'Locker Rooms & Showers',
      'Pro Shop',
      'Drinking Fountains',
      'Seating Areas'
    ],
    features: [
      { icon: 'users', text: '4 Courts' },
      { icon: 'parking', text: 'Free Parking' },
      { icon: 'utensils', text: 'Cafe' }
    ]
  },
  {
    id: 2,
    name: 'Riverside Pickleball Club',
    address: '456 River Drive',
    city: 'Quezon City',
    distance: '3.8 km away',
    image: 'https://images.unsplash.com/photo-1518604666863-5dde88b5cd2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    phone: '(02) 8234 5678',
    hours: [
      'Monday - Sunday: 6:00 AM - 11:00 PM',
      'Holidays: 7:00 AM - 9:00 PM'
    ],
    amenities: [
      '8 Professional Pickleball Courts',
      'Outdoor & Indoor Courts',
      'Locker Rooms & Showers',
      'Equipment Rental',
      'Café & Lounge',
      'Free Wi-Fi'
    ],
    features: [
      { icon: 'users', text: '6 Courts' },
      { icon: 'umbrella-beach', text: 'Outdoor' },
      { icon: 'shower', text: 'Showers' }
    ]
  },
  {
    id: 3,
    name: 'City Center Pickleball Arena',
    address: '789 Central Avenue',
    city: 'Makati',
    distance: '1.2 km away',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80',
    phone: '(02) 8456 7890',
    hours: [
      'Monday - Sunday: 5:30 AM - 11:30 PM'
    ],
    amenities: [
      '10 Professional Pickleball Courts',
      'Air-Conditioned Indoor Courts',
      'Luxury Locker Rooms',
      'Pro Shop',
      'Sports Bar & Restaurant',
      'Free Parking'
    ],
    features: [
      { icon: 'users', text: '8 Courts' },
      { icon: 'snowflake', text: 'Air-Conditioned' },
      { icon: 'dumbbell', text: 'Gym Access' }
    ]
  }
];

export const Home = () => {
  const navigate = useNavigate();
 

  return (
    <div className="home">
      <HeroBanner />
      
      {/* Locations Section */}
      <section className="locations-section">
        <div className="container">
          <h2 className="section-title">Pickle Court Locations</h2>
          <p className="section-subtitle">Find the perfect court near you</p>
          
          <div className="locations-grid">
            {locations.map(location => (
              <div key={location.id} className="location-card">
                <div className="location-image">
                  <img src={location.image} alt={location.name} />
                  <div className="location-overlay">
                    <button 
                      className="btn btn-outline"
                      onClick={() => navigate(`/locations/${location.id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
                <div className="location-details">
                  <div className="location-header">
                    <h3>{location.name}</h3>
                    <span className="distance">{location.distance}</span>
                  </div>
                  <p className="address">
                    <FaMapMarkerAlt className="icon" /> {location.address}, {location.city}
                  </p>
                  <div className="location-features">
                    {location.features.map((feature, index) => (
                      <span key={index} className="feature">
                        <i className={`fas fa-${feature.icon}`}></i> {feature.text}
                      </span>
                    ))}
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate(`/book/${location.id}`)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};
