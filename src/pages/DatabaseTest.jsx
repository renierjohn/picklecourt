import { useState, useEffect } from 'react';
import { getDatabase, ref, set, onValue, push, remove } from 'firebase/database';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/database-test.scss';

const DatabaseTest = () => {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbPath, setDbPath] = useState('events');
  const { user } = useAuth();
  const db = getDatabase();

  // Read data from the database
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const itemsRef = ref(db, dbPath);
    
    const unsubscribe = onValue(
      itemsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const itemsList = Object.entries(data).map(([id, item]) => ({
            id,
            ...item,
          }));
          setItems(itemsList);
        } else {
          setItems([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Database read failed:', error);
        setError('Failed to load data from database');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, dbPath, user]);

  // Add a new item to the database
  const addItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim() || !user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const itemsRef = ref(db, dbPath);
      const newItemRef = push(itemsRef);
      
      await set(newItemRef, {
        text: newItem,
        createdAt: new Date().toISOString(),
        createdBy: user.email || 'anonymous',
      });
      
      setNewItem('');
    } catch (error) {
      console.error('Error adding document: ', error);
      setError('Failed to add item to database');
    } finally {
      setLoading(false);
    }
  };

  // Remove an item from the database
  const removeItem = async (id) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this item?')) {
      setLoading(true);
      setError('');
      
      try {
        const itemRef = ref(db, `${dbPath}/${id}`);
        await remove(itemRef);
      } catch (error) {
        console.error('Error removing document: ', error);
        setError('Failed to remove item from database');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!user) {
    return (
      <div className="database-test">
        <div className="container">
          <h2>Database Test</h2>
          <p>Please log in to test the database functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="database-test">
      <div className="container">
        <h2>Firebase Database Test</h2>
        
        <div className="database-controls">
          <div className="form-group">
            <label htmlFor="dbPath">Database Path:</label>
            <input
              type="text"
              id="dbPath"
              value={dbPath}
              onChange={(e) => setDbPath(e.target.value)}
              placeholder="Enter database path (e.g., 'test_items')"
            />
          </div>
          
          <form onSubmit={addItem} className="add-item-form">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Enter item text"
              disabled={loading}
            />
            <button type="submit" disabled={!newItem.trim() || loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </form>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="items-list">
          <h3>Items in Database:</h3>
          {loading && items.length === 0 ? (
            <p>Loading items...</p>
          ) : items.length === 0 ? (
            <p>No items found in the database.</p>
          ) : (
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <div className="item-content">
                    <span>{item.text}</span>
                    <small>
                      Added by {item.createdBy} on {new Date(item.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    disabled={loading}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="database-info">
          <h3>Database Information</h3>
          <p><strong>Current Path:</strong> {dbPath}</p>
          <p><strong>Items Count:</strong> {items.length}</p>
          <p><strong>User:</strong> {user.email}</p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTest;
