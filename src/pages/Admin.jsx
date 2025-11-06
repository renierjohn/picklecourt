import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, onSnapshot, getFirestore, getDocs, deleteDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth, auth } from '../contexts/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaCamera, FaSave, FaTimes, FaCalendarAlt, FaClock, FaMoneyBillWave, FaUserAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaReceipt, FaTrash } from 'react-icons/fa';
import '../styles/pages/admin.scss';
import '../styles/components/_booking-modal.scss';

export const Admin = () => {
  const db = getFirestore();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  // State for courts and bookings
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [courtsMap, setCourtsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({ name: '', image: null });
  const [paymentImages, setPaymentImages] = useState([]);
  const [paymentImagePreviews, setPaymentImagePreviews] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCourtForm, setShowCourtForm] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomedPaymentImage, setZoomedPaymentImage] = useState(null);

  const fileInputRef = useRef(null);

  const [courtForm, setCourtForm] = useState({ 
    id: null, 
    name: '', 
    location: '',
    price: '0.00',
    status: 'active',
    unavailableDays: [],
    unavailableHours: [''],
    daySpecificUnavailableHours: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    expandedDay: null,
    image: null,
    imagePreview: null,
    userId: ''
  });

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    danger: false
  });

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    location: '',
    photoURL: '',
    paymentMethods: []
  });

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

  const handleTimeChange = (index, value, day = null) => {
    setCourtForm(prev => {
      if (day) {
        // Update day-specific time slot
        const updatedDayHours = [...(prev.daySpecificUnavailableHours[day] || [])];
        updatedDayHours[index] = value;
        return {
          ...prev,
          daySpecificUnavailableHours: {
            ...prev.daySpecificUnavailableHours,
            [day]: updatedDayHours
          }
        };
      } else {
        // Update all-week time slot
        const currentHours = Array.isArray(prev.unavailableHours) ? [...prev.unavailableHours] : [];
        currentHours[index] = value;
        return {
          ...prev,
          unavailableHours: currentHours
        };
      }
    });
  };

  const addTimeSlot = (day = null) => {
    setCourtForm(prev => {
      if (day) {
        // Add day-specific time slot
        const currentHours = [...(prev.daySpecificUnavailableHours[day] || [])];
        return {
          ...prev,
          daySpecificUnavailableHours: {
            ...prev.daySpecificUnavailableHours,
            [day]: [...currentHours, '']
          }
        };
      } else {
        // Add all-week time slot
        const currentHours = Array.isArray(prev.unavailableHours) ? [...prev.unavailableHours] : [];
        return {
          ...prev,
          unavailableHours: [...currentHours, '']
        };
      }
    });
  };

  const removeTimeSlot = (index, day = null) => {
    setCourtForm(prev => {
      if (day) {
        // Remove day-specific time slot
        const updatedDayHours = [...(prev.daySpecificUnavailableHours[day] || [])];
        updatedDayHours.splice(index, 1);
        return {
          ...prev,
          daySpecificUnavailableHours: {
            ...prev.daySpecificUnavailableHours,
            [day]: updatedDayHours
          }
        };
      } else {
        // Remove all-week time slot
        return {
          ...prev,
          unavailableHours: prev.unavailableHours.filter((_, i) => i !== index)
        };
      }
    });
  };

  const toggleDaySpecificView = (day) => {
    setCourtForm(prev => {
      // If clicking the same day that's already expanded, close it
      if (prev.expandedDay === day) {
        return {
          ...prev,
          expandedDay: null
        };
      }
      
      // If the day has no time slots, initialize with an empty array
      if (!prev.daySpecificUnavailableHours[day]?.length) {
        return {
          ...prev,
          daySpecificUnavailableHours: {
            ...prev.daySpecificUnavailableHours,
            [day]: []
          },
          expandedDay: day
        };
      }
      
      // If the day has time slots, just toggle the expanded view
      return {
        ...prev,
        expandedDay: day
      };
    });
  };

  const getDayName = (day) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourtForm(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Fetch user profile data
  const fetchUserProfile = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserProfile({
          name: userData.name || '',
          email: userData.email || user.email || '',
          location: userData.location || '',
          photoURL: userData.photoURL || '',
          paymentMethods: userData.paymentMethods || []      
        });
        setImagePreview(userData.photoURL || '');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  // Handle profile image change
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaymentImageChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      // Store the file for upload
      const updatedPayments = [...paymentImages];
      updatedPayments[index] = file;
      setPaymentImages(updatedPayments);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedPreviews = [...paymentImagePreviews];
        updatedPreviews[index] = reader.result;
        setPaymentImagePreviews(updatedPreviews);
        
        // Also update the newPaymentMethod state for the preview
        setNewPaymentMethod(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addPaymentMethod = () => {
    if (newPaymentMethod.name && paymentImages[0]) {
      const newMethod = {
        name: newPaymentMethod.name,
        image: null, // Will be updated with the URL after upload
        imageFile: paymentImages[0] // Store the file for upload when saving
      };
      
      setUserProfile(prev => ({
        ...prev,
        paymentMethods: [...prev.paymentMethods, newMethod]
      }));
      
      // Reset the form
      setNewPaymentMethod({ name: '', image: null });
      setPaymentImages([]);
      setPaymentImagePreviews([]);
      
      // Reset the file input
      const fileInputs = document.querySelectorAll('.add-payment-method input[type="file"]');
      fileInputs.forEach(input => input.value = '');
      
      // Show success message
      setModalConfig({
        isOpen: true,
        title: 'Success',
        message: 'Payment method added successfully. Don\'t forget to save your profile to apply changes.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
        onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: 'Error',
        message: 'Please provide both a name and an image for the payment method',
        confirmText: 'OK',
        danger: true,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const removePaymentMethod = (index) => {
    const updatedPayments = [...userProfile.paymentMethods];
    updatedPayments.splice(index, 1);
    setUserProfile(prev => ({
      ...prev,
      paymentMethods: updatedPayments
    }));
  };

  // Handle profile form field changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Generate profile_id from name (lowercase with no whitespace)
      const profileId = userProfile.name.toLowerCase().replace(/\s+/g, '');
      
      const updates = {
        name: userProfile.name.trim(),
        location: userProfile.location.trim(),
        profile_id: profileId,
        updatedAt: new Date().toISOString()
      };

      // Upload new profile image if selected
      if (profileImage) {
        const storage = getStorage();
        const storageRef = ref(storage, `profile_images/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, profileImage);
        const downloadURL = await getDownloadURL(storageRef);
        updates.photoURL = downloadURL;
        setImagePreview(downloadURL);
      }

      // Process payment methods
      const updatedPaymentMethods = [];
      const storage = getStorage();
      
      // Process existing and new payment methods
      for (const method of userProfile.paymentMethods) {
        // If it's a new method with a file to upload
        if (method.imageFile) {
          const storageRef = ref(storage, `payment_methods/${user.uid}/${Date.now()}_${method.name.replace(/\s+/g, '_')}`);
          await uploadBytes(storageRef, method.imageFile);
          const downloadURL = await getDownloadURL(storageRef);
          
          updatedPaymentMethods.push({
            name: method.name,
            image: downloadURL
          });
        } 
        // If it's an existing method with a URL
        else if (method.image) {
          updatedPaymentMethods.push({
            name: method.name,
            image: method.image
          });
        }
      }
      
      updates.paymentMethods = updatedPaymentMethods;
      
      await updateDoc(doc(db, 'users', user.uid), updates);
      
      // Update local state
      setUserProfile(prev => ({
        ...prev,
        ...updates
      }));
      
      setIsEditingProfile(false);
      setProfileImage(null);
      setPaymentImages([]);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCourtSubmit = async (e) => {
    e.preventDefault();
    if (!user || !courtForm.name || !courtForm.location) return;
    
    const userId = user.uid;
    const timestamp = new Date();
    let imageUrl = courtForm.id ? courts.find(c => c.id === courtForm.id)?.image || null : null;
    
    try {
      // Upload image if a new one was selected
      if (courtForm.image && courtForm.image instanceof File) {
        const storage = getStorage();
        const storageRef = ref(storage, `courts/${userId}/${Date.now()}_${courtForm.image.name}`);
        await uploadBytes(storageRef, courtForm.image);
        imageUrl = await getDownloadURL(storageRef);
      }
      
      // Clean up day-specific unavailable hours (remove empty strings)
      const cleanedDaySpecificHours = {};
      Object.entries(courtForm.daySpecificUnavailableHours || {}).forEach(([day, hours]) => {
        cleanedDaySpecificHours[day] = hours.filter(Boolean);
      });

      const courtData = {
        name: courtForm.name.trim(),
        location: courtForm.location.trim(),
        price: parseFloat(courtForm.price) || 0,
        status: courtForm.status || 'active',
        unavailableDays: courtForm.unavailableDays || [],
        unavailableHours: courtForm.unavailableHours && courtForm.unavailableHours.filter(Boolean) || [],
        daySpecificUnavailableHours: cleanedDaySpecificHours,
        image: imageUrl,
        userId: userId,
        updatedAt: timestamp.toISOString()
      };

      if (courtForm.id) {
        // Update existing court
        const courtRef = doc(db, 'courts', courtForm.id);
        await updateDoc(courtRef, courtData);
      } else {
        // Add new court
        const newCourtRef = doc(collection(db, 'courts'));
        await setDoc(newCourtRef, {
          ...courtData,
          id: newCourtRef.id,
          createdAt: timestamp.toISOString()
        });
      }
      
      resetCourtForm();
    } catch (error) {
      console.error('Error saving court:', error);
      // Show error to user
      setModalConfig({
        isOpen: true,
        title: 'Error',
        message: 'Failed to save court. Please try again.',
        confirmText: 'OK',
        danger: true
      });
    }
  };

  const handleEditCourt = (court) => {
    setCourtForm({
      id: court.id,
      name: court.name,
      location: court.location,
      price: court.price || '0.00',
      status: court.status || 'active',
      unavailableDays: court.unavailableDays || [],
      unavailableHours: court.unavailableHours?.length ? [...court.unavailableHours, ''] : [''],
      daySpecificUnavailableHours: court.daySpecificUnavailableHours || {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      },
      image: court.image || null,
      imagePreview: court.image || null, // Show the existing image URL as preview
      userId: court.userId || '',
      expandedDay: null
    });
    setShowCourtForm(true);
  };
  
  const resetCourtForm = () => {
    setCourtForm({ 
      id: null, 
      name: '', 
      location: '',
      price: '0.00',
      status: 'active',
      unavailableDays: [],
      unavailableHours: [''],
      daySpecificUnavailableHours: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
        sunday: []
      },
      expandedDay: null,
      image: null,
      imagePreview: null,
      userId: ''
    });
    setShowCourtForm(false);
  };
  
  const handleDeleteCourt = async (courtId) => {
    const court = courts.find(c => c.id === courtId);
    if (!court) return;
    
    setModalConfig({
      isOpen: true,
      title: 'Delete Court',
      message: `Are you sure you want to delete "${court.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'courts', courtId));
          // Also delete related bookings
          const bookingsQuery = query(
            collection(db, 'bookings'),
            where('courtId', '==', courtId)
          );
          const querySnapshot = await getDocs(bookingsQuery);
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting court:', error);
          setModalConfig({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete court. Please try again.',
            confirmText: 'OK',
            danger: true
          });
        }
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const toggleCourtStatus = async (courtId, newStatus) => {
    try {
      const courtRef = doc(db, 'courts', courtId);
      const status = newStatus || (courts.find(c => c.id === courtId)?.status === 'active' ? 'inactive' : 'active');
      await updateDoc(courtRef, {
        status,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating court status:', error);
      setModalConfig({
        isOpen: true,
        title: 'Error',
        message: 'Failed to update court status. Please try again.',
        confirmText: 'OK',
        danger: true
      });
    }
  };

  const handleViewBooking = (booking) => {  
    setSelectedBooking(booking);
  };

  const handleCloseBookingModal = () => {
    setSelectedBooking(null);
    setZoomedImage(null);
  };

  const toggleZoomImage = (imageUrl) => {
    setZoomedImage(zoomedImage ? null : imageUrl);
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'confirmed',
        updatedAt: new Date().toISOString()
      });
      
      setModalConfig({
        isOpen: true,
        title: 'Success',
        message: 'Booking has been confirmed successfully!',
        confirmText: 'Close',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })),
        onCancel: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }))
          const bookingRef = doc(db, 'bookings', bookingId);
          updateDoc(bookingRef, {
            status: 'pending',
            updatedAt: new Date().toISOString()
          });
        }
      });
      
      // Close the booking details modal if open
      setSelectedBooking(null);
    } catch (error) {
      console.error('Error confirming booking:', error);
      setModalConfig({
        isOpen: true,
        title: 'Error',
        message: 'Failed to confirm booking. Please try again.',
        confirmText: 'OK',
        danger: true
      });
    }
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

  const handleDeleteBooking = (bookingId) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Booking',
      message: 'Are you sure you want to delete this booking? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        try {
          const bookingRef = doc(db, 'bookings', bookingId);
          await deleteDoc(bookingRef);
          // Update the local state to remove the deleted booking
          setBookings(prev => prev.filter(b => b.id !== bookingId));
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting booking:', error);
          setModalConfig({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete booking. Please try again.',
            confirmText: 'OK',
            danger: true
          });
        }
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleDeleteAllRecentBookings = () => {
    if (recentBookings.length === 0) return;
    
    setModalConfig({
      isOpen: true,
      title: 'Delete All Recent Bookings',
      message: `Are you sure you want to delete all ${recentBookings.length} recent bookings? This action cannot be undone.`,
      confirmText: 'Delete All',
      danger: true,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          const bookingRefs = recentBookings.map(booking => doc(db, 'bookings', booking.id));
          
          // Add all delete operations to the batch
          bookingRefs.forEach(ref => {
            batch.delete(ref);
          });
          
          // Commit the batch
          await batch.commit();
          
          // Update local state
          setBookings(prev => prev.filter(b => {
            const bookingDate = b.date?.toDate ? b.date.toDate() : new Date(b.date);
            return bookingDate >= new Date(); // Keep only upcoming bookings
          }));
          
          setModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error deleting bookings:', error);
          setModalConfig({
            isOpen: true,
            title: 'Error',
            message: 'Failed to delete bookings. Please try again.',
            confirmText: 'OK',
            danger: true
          });
        }
      },
      onCancel: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Filter upcoming bookings (today and future) for managed courts
  const managedCourtIds = courts.map(court => court.id);

  const upcomingBookings = bookings
    .filter(booking => {
      const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
      const isUpcoming = bookingDate >= new Date();
      const isManagedCourt = managedCourtIds.includes(booking.courtId);  
      return booking.date && isUpcoming && isManagedCourt;
    })
    .sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateA - dateB;
    })
    .slice(0, 20); // Show the next 20 upcoming bookings
  // Filter recent bookings (past bookings)
  const recentBookings = bookings
    .filter(booking => booking.date && new Date(booking.date) < new Date())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Subscription data - in a real app, this would come from an API or user profile
  const subscriptionData = {
    status: 'Active',
    dueDate: user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : new Date(),
    plan: 'Premium',
    courts: courts.map(court => court.name).slice(0, 3) // Show first 3 court names
  };


  // Fetch courts data from Firestore
  useEffect(() => {
    if (!user) return;

    // Subscribe to courts collection
    const courtsQuery = query(
      collection(db, 'courts'),
      where('userId', '==', user.uid)
    );

    const unsubscribeCourts = onSnapshot(courtsQuery, (snapshot) => {
      const courtsData = [];
      const newCourtsMap = {};

      snapshot.forEach((doc) => {
        const courtData = { id: doc.id, ...doc.data() };
        newCourtsMap[doc.id] = courtData.name;
        courtsData.push(courtData);
      });

      setCourts(courtsData);
      setCourtsMap(newCourtsMap); // Update the courts map
      setLoading(false);
    });

    return () => unsubscribeCourts();
  }, [user]);

  // Fetch bookings data after courts are loaded
  useEffect(() => {
    if (Object.keys(courtsMap).length === 0) return;

    const bookingsQuery = query(collection(db, 'bookings'));

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map((doc) => {
        const bookingData = doc.data();
        const courtId = bookingData.courtId;
        const courtName = courtId ? (courtsMap[courtId] || 'Unknown Court') : 'Unknown Court';

        // Format the date for display
        const bookingDate = bookingData.date?.toDate ? bookingData.date.toDate() : new Date(bookingData.date);
        const formattedDate = format(bookingDate, 'MMM d, yyyy');

        // Format the time slots
        let formattedTimes = '';
        if (Array.isArray(bookingData.times)) {
          formattedTimes = bookingData.times.join(', ');
        } else if (bookingData.time) {
          formattedTimes = bookingData.time;
        }

        return {
          id: doc.id,
          ...bookingData,
          courtName,
          formattedDate,
          formattedTimes,
          date: bookingData.date,
          totalPrice: bookingData.totalPrice || 0
        };
      });

      setBookings(bookingsData);
    });

    return () => unsubscribeBookings();
  }, [courtsMap]); // This effect depends on courtsMap

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    } else if (user) {
      // Fetch user profile when component mounts and user is available
      fetchUserProfile(user.uid);
    }
  }, [user, loading, navigate]);

  return (
    <div className="admin-page">
      <div className="container">
        <h1 className="page-title">Admin Dashboard</h1>
        
        {/* User Profile Section */}
        <div className="profile-section">
          <div className="profile-card">
            <div className="profile-header">
              <h2>My Profile</h2>
              {!isEditingProfile ? (
                <button 
                  className="btn-edit"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <FaUser /> Edit Profile
                </button>
              ) : (
                <div className="profile-actions">
                  <button 
                    className="btn-cancel"
                    onClick={() => {
                      setIsEditingProfile(false);
                      fetchUserProfile(user.uid);
                    }}
                    disabled={isUpdating}
                  >
                    <FaTimes /> Cancel
                  </button>
                  <button 
                    className="btn-save"
                    onClick={saveProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : <><FaSave /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>
            
            <div className="profile-content">
              <div className="profile-image-container">
                {isEditingProfile ? (
                  <div className="image-upload-wrapper">
                    <div 
                      className="profile-image"
                      onClick={() => fileInputRef.current.click()}
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile" />
                      ) : (
                        <div className="empty-avatar">
                          <FaUser />
                        </div>
                      )}
                      <div className="image-overlay">
                        <FaCamera />
                        <span>Change Photo</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfileImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <div className="profile-image">
                    {userProfile.photoURL ? (
                      <img src={userProfile.photoURL} alt="Profile" />
                    ) : (
                      <div className="empty-avatar">
                        <FaUser />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="profile-details">
                {isEditingProfile ? (
                  <>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={userProfile.name}
                        onChange={handleProfileChange}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={userProfile.email}
                        disabled
                        placeholder="Email"
                      />
                    </div>
                    <div className="form-group">
                      <label>Location</label>
                      <input
                        type="text"
                        name="location"
                        value={userProfile.location}
                        onChange={handleProfileChange}
                        placeholder="Your business location"
                      />
                    </div>
                   
                    <div className="payment-methods">
                      <h4>Payment Methods</h4>
                      <div className="payment-methods-grid">
                        {userProfile.paymentMethods?.map((method, index) => (
                          <div key={index} className="payment-method">
                            <div className="payment-method-content">
                              <div 
                                className="payment-method-image"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomedPaymentImage(method.image);
                                }}
                              >
                                <img src={method.image} alt={method.name} />
                              </div>
                              <div className="payment-method-info">
                                <div className="payment-method-name">{method.name}</div>
                                <button 
                                  type="button" 
                                  className="btn-remove"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removePaymentMethod(index);
                                  }}
                                  disabled={isUpdating}
                                  title="Remove payment method"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="add-payment-method">
                        <input
                          type="text"
                          value={newPaymentMethod.name}
                          onChange={(e) => setNewPaymentMethod({
                            ...newPaymentMethod,
                            name: e.target.value
                          })}
                          placeholder="Payment method name"
                        />
                        <label className="file-upload-btn">
                          <input
                            type="file"
                            onChange={(e) => handlePaymentImageChange(e, 0)}
                            accept="image/*"
                            style={{ display: 'none' }}
                          />
                          <span>Upload Logo</span>
                          {paymentImagePreviews[0] && (
                            <img 
                              src={paymentImagePreviews[0]} 
                              alt="Preview" 
                              style={{
                                width: '24px',
                                height: '24px',
                                marginLeft: '8px',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                        </label>
                        <button 
                          type="button" 
                          className="btn-add"
                          onClick={addPaymentMethod}
                          disabled={!newPaymentMethod.name.trim() || !paymentImages[0]}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{userProfile.name || 'No Name'}</h3>
                    <p className="email">{userProfile.email}</p>
                    {userProfile.location && (
                      <p className="location">
                        <i className="fas fa-map-marker-alt"></i> {userProfile.location}
                      </p>
                    )}
                    {userProfile.paymentMethods?.length > 0 && (
                      <div className="payment-methods-preview">
                      <h4>Payment Methods</h4>
                      <div className="payment-methods-grid">
                        {userProfile.paymentMethods.map((method, index) => (
                          <div key={index} className="payment-method-badge">
                            <div className="payment-method-content">
                              {method.image && (
                                <div className="payment-method-image"
                                 onClick={(e) => {
                                  e.stopPropagation();
                                  setZoomedPaymentImage(method.image);
                                }}
                                >
                                  <img src={method.image} alt={method.name} />
                                </div>
                              )}
                              <div className="payment-method-name">{method.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
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
            <p className="stat-number">
              {bookings.filter(booking => managedCourtIds.includes(booking.courtId)).length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Confirmed</h3>
            <p className="stat-number">
              {bookings.filter(booking => 
                booking.status === 'confirmed' && 
                managedCourtIds.includes(booking.courtId)
              ).length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-number">
              {bookings.filter(booking => 
                booking.status === 'pending' && 
                managedCourtIds.includes(booking.courtId)
              ).length}
            </p>
          </div>
          <div className="stat-card">
            <h3>Revenue</h3>
            <p className="stat-number">
              Php {bookings
                .filter(booking => 
                  booking.status === 'confirmed' && 
                  managedCourtIds.includes(booking.courtId)
                )
                .reduce((sum, booking) => sum + (parseFloat(booking.amount) || 0), 0)
                .toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <div className="input-with-prefix">
                  <span className="input-prefix">Php</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={courtForm.price}
                    onChange={(e) => setCourtForm({...courtForm, price: e.target.value})}
                    required
                  />
                </div>
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
                <label className="form-label">Unavailable Time Slots (All Week)</label>
                <div className="time-slots-container">
                  {courtForm.unavailableHours?.map((time, index) => (
                    <div key={`all-${index}`} className="time-slot-input">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        className="time-input"
                        placeholder="HH:MM"
                      />
                      <button 
                        type="button" 
                        className="remove-time"
                        onClick={() => removeTimeSlot(index)}
                        disabled={courtForm.unavailableHours.length <= 1}
                        title="Remove time slot"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    className="add-time"
                    onClick={() => addTimeSlot()}
                  >
                    + Add Time Slot (All Week)
                  </button>
                </div>
              </div>

                {/* Day-Specific Unavailable Time Slots */}
              <div className="form-group">
                <label className="form-label">Day-Specific Unavailable Time Slots</label>
                <div className="day-selector">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-option ${courtForm.daySpecificUnavailableHours[day]?.length > 0 ? 'selected' : ''}`}
                      onClick={(e) => {
                        // If command/ctrl key is pressed, clear the day's time slots
                        if (e.metaKey || e.ctrlKey) {
                          e.preventDefault();
                          setCourtForm(prev => ({
                            ...prev,
                            daySpecificUnavailableHours: {
                              ...prev.daySpecificUnavailableHours,
                              [day]: []
                            }
                          }));
                        } else {
                          // Normal click - toggle the time slots panel
                          toggleDaySpecificView(day);
                        }
                      }}
                    >
                      {day.charAt(0).toUpperCase() + day.slice(1, 3)}&nbsp;
                      {courtForm.daySpecificUnavailableHours[day]?.length > 0 && (
                        <span className="time-count">({courtForm.daySpecificUnavailableHours[day].length})</span>
                      )}
                    </button>
                  ))}
                </div>

                {courtForm.expandedDay && (
                  <div className="time-slots-panel">
                    <div className="panel-header">
                      <h4>{getDayName(courtForm.expandedDay)} Unavailable Times</h4>
                      <button
                        type="button"
                        className="close-panel"
                        onClick={() => setCourtForm(prev => ({ ...prev, expandedDay: null }))}
                        aria-label="Close panel"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    
                    <div className="time-slots-list">
                      {(courtForm.daySpecificUnavailableHours[courtForm.expandedDay] || []).length > 0 ? (
                        (courtForm.daySpecificUnavailableHours[courtForm.expandedDay] || []).map((time, index) => (
                          <div key={index} className="time-slot-item">
                            <div className="time-input-wrapper">
                              <FaClock className="time-icon" />
                              <input
                                type="time"
                                value={time}
                                onChange={(e) => handleTimeChange(index, e.target.value, courtForm.expandedDay)}
                                className="time-input"
                              />
                            </div>
                            <button
                              type="button"
                              className="remove-time"
                              onClick={() => removeTimeSlot(index, courtForm.expandedDay)}
                              aria-label="Remove time slot"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="no-times-message">
                          No time slots added for {getDayName(courtForm.expandedDay)}. Click below to add one.
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      className="add-time-btn"
                      onClick={() => addTimeSlot(courtForm.expandedDay)}
                    >
                      <span>+</span> Add Time Slot
                    </button>
                  </div>
                )}
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
                  <div className="court-price">Php {parseFloat(court.price || 0).toFixed(2)}</div>
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
            <div className="table-responsive">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Court</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time Slots</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.courtName}</td>
                      <td>{booking.user ? booking.user.name : 'Guest'}</td>
                      <td>{booking.formattedDate}</td>
                      <td>{booking.formattedTimes}</td>
                      <td>
                        {booking.user && (
                          <div className="contact-info">
                            <div>{booking.user.phone}</div>
                            {booking.user.email && <div className="text-muted small">{booking.user.email}</div>}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status || 'pending'}`}>
                          {booking.status || 'Pending'}
                        </span>
                      </td>
                      <td>₱{Number(booking.totalPrice || 0).toFixed(2)}</td>
                      <td className="actions">
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleViewBooking(booking)}
                            title="View details"
                          >
                            View
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleConfirmBooking(booking.id)}
                            title="Confirm"
                            disabled={booking.status === 'confirmed'}
                          >
                            {booking.status === 'confirmed' ? 'Confirmed' : 'Confirm'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-bookings">
              <p>No upcoming bookings found.</p>
            </div>
          )}
        </div>

        {/* Recent Bookings Table */}
        <div className="bookings-table-container" style={{ marginTop: '2rem' }}>
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Recent Bookings</h2>
              <span className="badge">{recentBookings.length} Completed</span>
            </div>
            {recentBookings.length > 0 && (
              <button 
                className="btn btn-danger"
                onClick={handleDeleteAllRecentBookings}
                disabled={recentBookings.length === 0}
              >
                <FaTrash /> Delete All Recent
              </button>
            )}
          </div>
          
          {recentBookings.length > 0 ? (
            <div className="table-responsive">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Court</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Time Slots</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map(booking => {
                    const bookingDate = booking.date?.toDate ? booking.date.toDate() : new Date(booking.date);
                    const formattedDate = format(bookingDate, 'MMM d, yyyy');
                    const court = courts.find(c => c.id === booking.courtId);
                    const courtName = court ? court.name : 'Unknown Court';
                    
                    return (
                      <tr key={booking.id}>
                        <td>{courtName}</td>
                        <td>{booking.userName || 'Guest'}</td>
                        <td>{formattedDate}</td>
                        <td>{booking.timeSlot}</td>
                        <td>
                          <div className="contact-info">
                            <div>{booking.phone || 'N/A'}</div>
                            {booking.email && <div className="text-muted small">{booking.email}</div>}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${booking.status || 'completed'}`}>
                            {booking.status || 'Completed'}
                          </span>
                        </td>
                        <td>₱{booking.amount ? parseFloat(booking.amount).toFixed(2) : '0.00'}</td>
                        <td>
                          {booking.receiptNumber ? (
                            <span className="receipt-number">
                              {booking.receiptNumber}
                            </span>
                          ) : 'N/A'}
                        </td>
                        <td className="actions">
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteBooking(booking.id)}
                            title="Delete booking"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-bookings">
              <p>No recent bookings found.</p>
            </div>
          )}
        </div>
        
      </div>
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="booking-modal">
          <div className="modal-overlay" onClick={handleCloseBookingModal}>
            {zoomedImage && (
              <div className="zoomed-image-overlay" onClick={handleCloseBookingModal}>
                <img 
                  src={zoomedImage} 
                  alt="Payment proof" 
                  className="zoomed-image"
                  onClick={e => e.stopPropagation()}
                />
              </div>
            )}
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Booking Details</h3>
                <button className="close-btn" onClick={handleCloseBookingModal}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="booking-details">
                  <div className="detail-card">
                    <span className="detail-label">
                      <FaMapMarkerAlt className="mr-1" /> Court
                    </span>
                    <span className="detail-value">{selectedBooking.courtName}</span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">
                      <FaUserAlt className="mr-1" /> Customer
                    </span>
                    <span className="detail-value">{selectedBooking.user?.name || 'Guest'}</span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">
                      <FaCalendarAlt className="mr-1" /> Date
                    </span>
                    <span className="detail-value">{selectedBooking.formattedDate}</span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">
                      <FaClock className="mr-1" /> Time Slots
                    </span>
                    <span className="detail-value">{selectedBooking.formattedTimes}</span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">Status</span>
                    <span className={`detail-value status ${selectedBooking.status || 'pending'}`}>
                      {selectedBooking.status ? selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1) : 'Pending'}
                    </span>
                  </div>
                  
                  <div className="detail-card">
                    <span className="detail-label">
                      <FaMoneyBillWave className="mr-1" /> Amount
                    </span>
                    <span className="detail-value amount">₱{Number(selectedBooking.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  
                  {selectedBooking.phone && (
                    <div className="detail-card">
                      <span className="detail-label">
                        <FaPhone className="mr-1" /> Contact
                      </span>
                      <a href={`tel:${selectedBooking.phone}`} className="detail-value">
                        {selectedBooking.phone}
                      </a>
                    </div>
                  )}
                  
                  {selectedBooking.email && (
                    <div className="detail-card">
                      <span className="detail-label">
                        <FaEnvelope className="mr-1" /> Email
                      </span>
                      <a href={`mailto:${selectedBooking.email}`} className="detail-value">
                        {selectedBooking.email}
                      </a>
                    </div>
                  )}
                </div>
                
                {selectedBooking.notes && (
                  <div className="notes-section">
                    <div className="notes-label">Additional Notes</div>
                    <div className="notes-content">{selectedBooking.notes}</div>
                  </div>
                )}

                {(selectedBooking.paymentProof || selectedBooking.paymentImage) && (
                  <div className="payment-proof-section">
                    <div className="section-title">
                      <FaReceipt /> Payment Proof
                    </div>
                    <div className="payment-proof-image-container">
                      <img 
                        src={selectedBooking.paymentProof || selectedBooking.paymentImage} 
                        alt="Payment proof" 
                        className="payment-proof-image"
                        onClick={() => toggleZoomImage(selectedBooking.paymentProof || selectedBooking.paymentImage)}
                      />
                      <div className="zoom-hint">Click to zoom</div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={handleCloseBookingModal}
                >
                  Close
                </button>
                {selectedBooking.status !== 'confirmed' && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleConfirmBooking(selectedBooking.id)}
                  >
                    Confirm Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Payment Image Modal */}
      {zoomedPaymentImage && (
        <div className="modal-overlay" onClick={() => setZoomedPaymentImage(null)}>
          <div className="zoomed-image-container" onClick={e => e.stopPropagation()}>
            <button 
              className="close-zoom" 
              onClick={(e) => {
                e.stopPropagation();
                setZoomedPaymentImage(null);
              }}
            >
              ×
            </button>
            <img src={zoomedPaymentImage} alt="Zoomed Payment Method" className="zoomed-image" />
          </div>
        </div>
      )}
      
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
