import { useState } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import { format } from 'date-fns';
import '../styles/pages/admin.scss';

export const Admin = () => {
  // Sample court data
  const courtsJson = [
    { 
      id: 1, 
      name: 'Court 1', 
      status: 'active', 
      location: 'Main Building',
      unavailableDays: ['saturday', 'sunday'],
      unavailableHours: ['12:00-13:00'],
      image: null
    },
    { 
      id: 2, 
      name: 'Court 2', 
      status: 'maintenance', 
      location: 'Main Building',
      unavailableDays: [],
      unavailableHours: [],
      image: null
    },
    { 
      id: 3, 
      name: 'Court 3', 
      status: 'active', 
      location: 'Annex Building',
      unavailableDays: ['monday', 'wednesday'],
      unavailableHours: ['11:30-12:30', '16:00-17:00'],
      image: null
    },
  ];
  
  const bookingsJson = [
    {
      id: 'B001',
      courtName: 'Court 1',
      userName: 'John Doe',
      date: new Date(), // Today
      time: '10:00 - 11:00',
      status: 'confirmed',
      amount: 25.0,
    },
    {
      id: 'B002',
      courtName: 'Court 2',
      userName: 'Jane Smith',
      date: new Date(Date.now() + 86400000), // Tomorrow
      time: '14:00 - 15:00',
      status: 'confirmed',
      amount: 25.0,
    },
    {
      id: 'B003',
      courtName: 'Court 3',
      userName: 'Mike Johnson',
      date: new Date(Date.now() + 2 * 86400000), // Day after tomorrow
      time: '16:00 - 17:00',
      status: 'pending',
      amount: 25.0,
    },
    {
      id: 'B004',
      courtName: 'Court 1',
      userName: 'Sarah Williams',
      date: new Date(Date.now() - 86400000), // Yesterday
      time: '09:00 - 10:00',
      status: 'completed',
      amount: 25.0,
    },
    {
      id: 'B005',
      courtName: 'Court 2',
      userName: 'David Brown',
      date: new Date(Date.now() - 2 * 86400000), // 2 days ago
      time: '11:00 - 12:00',
      status: 'completed',
      amount: 25.0,
    },
  ];

  const [courts, setCourts] = useState(courtsJson);
  
  const [courtForm, setCourtForm] = useState({ 
    id: null, 
    name: '', 
    location: '',
    unavailableDays: [],
    unavailableHours: [''],
    image: null,
    imagePreview: null
  });
  const [showCourtForm, setShowCourtForm] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    danger: false
  });

  // Sample booking data
  const [bookings, setBookings] = useState(bookingsJson);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge confirmed">Confirmed</span>;
      case 'pending':
        return <span className="badge pending">Pending</span>;
      case 'cancelled':
        return <span className="badge cancelled">Cancelled</span>;
      case 'active':
        return <span className="badge confirmed">Active</span>;
      case 'maintenance':
        return <span className="badge warning">Maintenance</span>;
      case 'inactive':
        return <span className="badge cancelled">Inactive</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };
  
  const handleDayToggle = (day) => {
    setCourtForm(prev => {
      const currentDays = Array.isArray(prev.unavailableDays) ? prev.unavailableDays : [];
      return {
        ...prev,
        unavailableDays: currentDays.includes(day)
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day]
      };
    });
  };

  const handleTimeChange = (index, value) => {
    setCourtForm(prev => {
      const currentHours = Array.isArray(prev.unavailableHours) ? [...prev.unavailableHours] : [];
      currentHours[index] = value;
      return {
        ...prev,
        unavailableHours: currentHours
      };
    });
  };

  const addTimeSlot = () => {
    setCourtForm(prev => {
      const currentHours = Array.isArray(prev.unavailableHours) ? [...prev.unavailableHours] : [];
      return {
        ...prev,
        unavailableHours: [...currentHours, '']
      };
    });
  };

  const removeTimeSlot = (index) => {
    setCourtForm(prev => ({
      ...prev,
      unavailableHours: prev.unavailableHours.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCourtForm(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCourtSubmit = (e) => {
    e.preventDefault();
    if (courtForm.name && courtForm.location) {
      const courtData = {
        name: courtForm.name.trim(),
        location: courtForm.location.trim(),
        unavailableDays: courtForm.unavailableDays || [],
        unavailableHours: courtForm.unavailableHours.filter(Boolean) || [],
        image: courtForm.image,
        imagePreview: courtForm.imagePreview
      };

      if (courtForm.id) {
        // Update existing court
        setCourts(courts.map(court => 
          court.id === courtForm.id 
            ? { ...court, ...courtData }
            : court
        ));
      } else {
        // Add new court
        const newCourt = {
          ...courtData,
          id: Math.max(0, ...courts.map(c => c.id)) + 1,
          status: 'active'
        };
        setCourts([...courts, newCourt]);
      }
      resetCourtForm();
    }
  };

  const handleEditCourt = (court) => {
    setCourtForm({
      id: court.id,
      name: court.name,
      location: court.location,
      unavailableDays: court.unavailableDays || [],
      unavailableHours: court.unavailableHours?.length ? [...court.unavailableHours, ''] : [''],
      image: court.image || null,
      imagePreview: court.imagePreview || null
    });
    setShowCourtForm(true);
  };
  
  const resetCourtForm = () => {
    setCourtForm({ 
      id: null, 
      name: '', 
      location: '',
      unavailableDays: [],
      unavailableHours: [''],
      image: null,
      imagePreview: null
    });
    setShowCourtForm(false);
  };
  
  const handleDeleteCourt = (courtId) => {
    const court = courts.find(c => c.id === courtId);
    setModalConfig({
      isOpen: true,
      title: 'Delete Court',
      message: `Are you sure you want to delete "${court.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: () => {
        setCourts(courts.filter(c => c.id !== courtId));
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const toggleCourtStatus = (courtId, newStatus) => {
    setCourts(courts.map(court => 
      court.id === courtId 
        ? { 
            ...court, 
            status: newStatus || (court.status === 'active' ? 'inactive' : 'active')
          } 
        : court
    ));
  };
  
  const handleMaintenance = (courtId) => {
    const court = courts.find(c => c.id === courtId);
    const isMaintenance = court.status === 'maintenance';
    const newStatus = isMaintenance ? 'active' : 'maintenance';
    
    setModalConfig({
      isOpen: true,
      title: isMaintenance ? 'Mark as Available' : 'Put Under Maintenance',
      message: isMaintenance
        ? `Mark "${court.name}" as active and available for booking?`
        : `Put "${court.name}" under maintenance? It will be unavailable for booking.`,
      confirmText: isMaintenance ? 'Mark Available' : 'Put in Maintenance',
      danger: false,
      onConfirm: () => {
        toggleCourtStatus(courtId, newStatus);
        setModalConfig(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Filter upcoming bookings (today and future)
  const upcomingBookings = bookings
    .filter(booking => booking.date >= new Date())
    .sort((a, b) => a.date - b.date);

  // Filter recent bookings (past bookings)
  const recentBookings = bookings
    .filter(booking => booking.date < new Date())
    .sort((a, b) => b.date - a.date);

  // Subscription data - in a real app, this would come from an API
  const subscriptionData = {
    status: 'Active',
    dueDate: new Date('2025-10-31'),
    plan: 'Premium',
    courts: ['Court 1', 'Court 2', 'Court 3']
  };

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="page-title">Admin Dashboard</h1>
        
        <div className="subscription-status">
          <div className="subscription-card">
            <div className="subscription-header">
              <h2>Subscription Status</h2>
              <span className={`status-badge ${subscriptionData.status.toLowerCase()}`}>
                {subscriptionData.status}
              </span>
            </div>
            <div className="subscription-details">
              <div className="detail">
                <span className="label">Plan:</span>
                <span className="value">{subscriptionData.plan}</span>
              </div>
              <div className="detail">
                <span className="label">Due Date:</span>
                <span className="value">{format(subscriptionData.dueDate, 'MMM d, yyyy')}</span>
              </div>
              <div className="detail">
                <span className="label">Included Courts:</span>
                <span className="value">{subscriptionData.courts.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-cards">
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <p className="stat-number">{bookings.length}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p className="stat-number">
              {bookings.filter(b => b.status === 'confirmed').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-number">
              {bookings.filter(b => b.status === 'pending').length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Revenue</h3>
            <p className="stat-number">
              Php {bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, booking) => sum + booking.amount, 0)
                .toFixed(2)}
            </p>
          </div>
        </div>

        {/* Add Court Section */}
        <div className="admin-section">
          <div className="section-header">
            <h2>Manage Courts</h2>
            <button 
              className="btn btn-primary"
              onClick={() => {
                if (showCourtForm) {
                  resetCourtForm();
                } else {
                  setCourtForm({ id: null, name: '', location: '' });
                  setShowCourtForm(true);
                }
              }}
            >
              {showCourtForm ? 'Cancel' : '+ Add Court'}
            </button>
          </div>
          
          {showCourtForm && (
            <form className="add-court-form" onSubmit={handleCourtSubmit}>
              <h3>{courtForm.id ? 'Edit Court' : 'Add New Court'}</h3>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Court Name"
                  value={courtForm.name}
                  onChange={(e) => setCourtForm({...courtForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Location"
                  value={courtForm.location}
                  onChange={(e) => setCourtForm({...courtForm, location: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unavailable Days</label>
                <div className="day-selector">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-option ${courtForm.unavailableDays?.includes(day) ? 'selected' : ''}`}
                      onClick={() => handleDayToggle(day)}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Unavailable Time Slots</label>
                {courtForm.unavailableHours?.map((time, index) => (
                  <div key={index} className="time-slot-input">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      className="time-input"
                      placeholder="HH:MM - HH:MM"
                    />
                    <button 
                      type="button" 
                      className="remove-time"
                      onClick={() => removeTimeSlot(index)}
                      disabled={courtForm.unavailableHours.length <= 1}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="add-time"
                  onClick={addTimeSlot}
                >
                  + Add Time Slot
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Court Image</label>
                <div className="image-upload">
                  <input
                    type="file"
                    id="court-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-input"
                  />
                  <label htmlFor="court-image" className="image-upload-label">
                    {courtForm.imagePreview ? (
                      <img 
                        src={courtForm.imagePreview} 
                        alt="Court preview" 
                        className="image-preview"
                      />
                    ) : (
                      <div className="upload-placeholder">
                        <span>+</span>
                        <p>Click to upload image</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {courtForm.id ? 'Update Court' : 'Add Court'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={resetCourtForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          
          <div className="courts-list">
            {courts.map(court => (
              <div key={court.id} className="court-item">
                <div className="court-image-preview">
                  <div className="image-gradient-overlay">
                    {court.image ? (
                      <img src={court.image} alt={`${court.name} preview`} className="court-preview-img" />
                    ) : (
                      <div className="default-court-image">
                        <i className="fas fa-table-tennis-paddle-ball"></i>
                      </div>
                    )}
                  </div>
                </div>
                <div className="court-info">
                  <h3>{court.name}</h3>
                  <span className="court-location">{court.location}</span>
                  {getStatusBadge(court.status)}
                </div>
                <div className="court-actions">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEditCourt(court)}
                    title="Edit court details"
                  >
                    Edit
                  </button>
                  <button 
                    className={`btn btn-sm ${court.status === 'maintenance' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => handleMaintenance(court.id)}
                    title={court.status === 'maintenance' ? 'Mark as Available' : 'Mark as Maintenance'}
                  >
                    Set to Maintenance
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleDeleteCourt(court.id)}
                    title="Delete court"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bookings-table-container">
          <div className="section-header">
            <h2>Upcoming Bookings</h2>
            <span className="badge">{upcomingBookings.length} Upcoming</span>
          </div>
          
          {upcomingBookings.length > 0 ? (
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Court</th>
                  <th>User</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingBookings.map(booking => (
                  <tr key={booking.id}>
                    <td>{booking.courtName}</td>
                    <td>{booking.userName}</td>
                    <td>{format(booking.date, 'MMM d, yyyy')}</td>
                    <td>{booking.time}</td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>PHP {booking.amount.toFixed(2)}</td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {}}
                        title="View details"
                      >
                        View
                      </button>
                      
                       <button 
                        className="btn btn-sm btn-outline-success"
                        onClick={() => {}}
                        title="Confirm"
                        disabled={booking.status === 'confirmed' ? 'disabled' : '' }
                      >
                        Confirm
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-bookings">
              <p>No upcoming bookings found.</p>
            </div>
          )}
        </div>
        
      </div>
      
      <ConfirmationModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        danger={modalConfig.danger}
        onConfirm={modalConfig.onConfirm}
        onCancel={modalConfig.onCancel}
      />
    </div>
  );
};
