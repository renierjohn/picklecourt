import { useState } from 'react';
import { FaMapMarkedAlt } from 'react-icons/fa';

const LocationPicker = ({initialLocation = '' }) => {
//   const [location, setLocation] = useState(initialLocation);
  const [showMap, setShowMap] = useState(false);

//   const handleLocationChange = (e) => {
//     const value = e.target.value;
//     setLocation(value);
//   };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="location-picker">
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', marginBottom: '10px' }}>
          {/* <input
            type="text"
            value={location}
            onChange={handleLocationChange}
            placeholder="Enter location (e.g., 123 Main St, City)"
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px 0 0 4px',
              border: '1px solid #ccc',
              fontSize: '14px',
              outline: 'none'
            }}
          /> */}
          <button
            type="button"
            onClick={toggleMap}
            style={{
              padding: '8px 16px',
              backgroundColor: showMap ? '#f44336' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '0 4px 4px 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}
          >
            <FaMapMarkedAlt />
            {showMap ? 'Hide Map' : 'Preview on Map'}
          </button>
        </div>

        {showMap && location && (
          <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://maps.google.com/maps?width=100%&height=600&hl=en&q=${encodeURIComponent(initialLocation)}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
              title="Location Preview"
              style={{ border: '1px solid #ddd', borderRadius: '8px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;