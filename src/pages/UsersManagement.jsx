import { useState, useEffect, useRef } from 'react';
import { collection, doc, getDocs, updateDoc, addDoc, query, where, getFirestore, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FaUser, FaCamera, FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import '../styles/pages/users-management.scss';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const { user } = useAuth(); // Changed from currentUser to user to match AuthContext
  const navigate = useNavigate();
  const db = getFirestore();
  const storage = getStorage();
  const auth = getAuth();

  // Check if current user is admin
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      console.log('User is not admin, redirecting...');
      navigate('/unauthorized');
      return;
    }

    fetchUsers();
  }, [user, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUsers(usersList);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm('Are you sure you want to update this user\'s role?')) {
      return;
    }

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setName(user.name || '');
    setLocation(user.location || '');
    setImagePreview(user.photoURL || '');
  };

  const handleImageChange = (e) => {
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const userRef = doc(db, 'users', editingUser.id);
      const updates = {
        name: name.trim(),
        location: location.trim(),
        updatedAt: serverTimestamp()
      };

      // Upload new profile image if selected
      if (profileImage) {
        const storageRef = ref(storage, `profile_images/${editingUser.id}_${Date.now()}`);
        await uploadBytes(storageRef, profileImage);
        const downloadURL = await getDownloadURL(storageRef);
        updates.photoURL = downloadURL;
      }

      await updateDoc(userRef, updates);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id ? { 
          ...user, 
          ...updates,
          photoURL: updates.photoURL || user.photoURL
        } : user
      ));
      
      // Reset form
      setEditingUser(null);
      setProfileImage(null);
      setImagePreview('');
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError('Failed to update user profile');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowAddForm(false);
    setProfileImage(null);
    setImagePreview('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setLocation('');
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email || !password || !name) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Create user in Firebase Authentication
      const { user: authUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Prepare user data for Firestore
      const userData = {
        uid: authUser.uid,
        email: email,
        name: name.trim(),
        role: role,
        status: 1, // Active by default
        location: location.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Upload profile image if selected
      if (profileImage) {
        const storageRef = ref(storage, `profile_images/${authUser.uid}_${Date.now()}`);
        await uploadBytes(storageRef, profileImage);
        const downloadURL = await getDownloadURL(storageRef);
        userData.photoURL = downloadURL;
      }

      // Add user to Firestore
      await addDoc(collection(db, 'users'), userData);
      
      // Refresh users list
      await fetchUsers();
      
      // Reset form
      cancelEdit();
    } catch (err) {
      console.error('Error adding user:', err);
      setError(err.message || 'Failed to add user');
    }
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="users-management">
      <div className="users-header">
        <h1>Manage Users</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowAddForm(true)}
        >
          <FaPlus /> Add User
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      
      {/* Add User Form */}
      {showAddForm && (
        <div className="user-form-container">
          <h2>Add New User</h2>
          <form onSubmit={handleAddUser} className="user-form">
            <div className="form-group">
              <label>Name *</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Email *</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Password *</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label>Role</label>
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Profile Image</label>
              <div className="image-upload-container">
                <div className="image-preview" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile Preview" />
                  ) : (
                    <div className="empty-avatar">
                      <FaUser />
                    </div>
                  )}
                  <div className="upload-overlay">
                    <FaCamera />
                    <span>Upload Photo</span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                <FaTimes /> Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <FaSave /> Add User
              </button>
            </div>
          </form>
        </div>
      )}
      
      {editingUser && (
        <div className="user-profile-edit">
          <h2>Edit User Profile</h2>
          <form onSubmit={handleSaveProfile}>
            <div className="profile-image-upload">
              <div className="image-preview" onClick={() => fileInputRef.current.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile Preview" />
                ) : (
                  <div className="empty-avatar">
                    <FaUser />
                  </div>
                )}
                <div className="upload-overlay">
                  <FaCamera />
                  <span>Change Photo</span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user's name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter user's location"
              />
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                <FaTimes /> Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                <FaSave /> Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="users-list">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{user.name || 'N/A'}</td>
                <td>
                  <select 
                    value={user.role || 'user'} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </td>
                <td>
                  <label className="status-toggle">
                    <input 
                      type="checkbox" 
                      checked={user.status === 1}
                      onChange={() => handleStatusToggle(user.id, user.status || 0)}
                    />
                    <span className="slider round"></span>
                    <span className="status-text">{user.status === 1 ? 'Active' : 'Inactive'}</span>
                  </label>
                </td>
                <td>
                  <div className="user-actions">
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEditUser(user)}
                    >
                      Edit Profile
                    </button>
                    <button 
                      className="btn btn-sm"
                      onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                      disabled={user.id === user?.uid}
                    >
                      {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersManagement;
