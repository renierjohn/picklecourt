import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  getFirestore,
  query,
  where,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import '../styles/pages/database-test.scss';

const DatabaseTest = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('users');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState({
    read: false,
    write: false,
    admin: false
  });
  const db = getFirestore();
  const { user } = useAuth();

  // List available collections
  useEffect(() => {
    if (!user) return;
    
    const fetchCollections = async () => {
      try {
        setLoading(true);
        // This is a workaround since there's no direct way to list collections in v9
        // You might need to maintain a list of collections in a document
        const defaultCollections = ['users', 'bookings', 'courts', 'payments'];
        setCollections(defaultCollections);
        
        // Check user permissions
        if (user.role === 'admin') {
          setPermissions({
            read: true,
            write: true,
            admin: true
          });
        } else {
          setPermissions({
            read: true,
            write: false,
            admin: false
          });
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
        setError('Failed to fetch collections');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [user]);

  // Fetch documents from selected collection
  useEffect(() => {
    if (!user || !selectedCollection) return;
    
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError('');
        
        const q = query(collection(db, selectedCollection));
        const querySnapshot = await getDocs(q);
        
        const docs = [];
        querySnapshot.forEach((doc) => {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setError(`Failed to load documents from ${selectedCollection}`);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
    
    // Set up real-time listener
    const q = query(collection(db, selectedCollection));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = [];
        snapshot.forEach((doc) => {
          docs.push({
            id: doc.id,
            ...doc.data()
          });
        });
        setDocuments(docs);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        setError('Error receiving real-time updates');
      }
    );
    
      return () => unsubscribe();
  }, [selectedCollection, user]);

  if (!user) {
    return (
      <div className="database-test">
        <div className="container">
          <h2>Firestore Database Test</h2>
          <p>Please log in to test the Firestore database functionality.</p>
        </div>
      </div>
    );
  }

  const deleteDocument = async (docId) => {
    if (!user || !permissions.write) return;
    
    try {
      setLoading(true);
      setError('');
      
      const docRef = doc(db, selectedCollection, docId);
      await deleteDoc(docRef);
      
    } catch (error) {
      console.error('Error deleting document:', error);
      setError(`Failed to delete document: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="database-test">
      <div className="container">
        <h2>Firestore Database Test</h2>
        
        {!permissions.read ? (
          <div className="permission-warning">
            <p>You don't have permission to view this data. Please contact an administrator.</p>
          </div>
        ) : (
          <>
            <div className="db-controls">
              <div className="form-group">
                <label htmlFor="collection">Select Collection:</label>
                <select
                  id="collection"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  disabled={loading}
                >
                  {collections.map((collection) => (
                    <option key={collection} value={collection}>
                      {collection}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="permissions-badge">
                <span className={permissions.read ? 'active' : ''} title="Read Access">R</span>
                <span className={permissions.write ? 'active' : ''} title="Write Access">W</span>
                <span className={permissions.admin ? 'active' : ''} title="Admin Access">A</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="db-content">
              <div className="db-documents">
                <h3>Documents in {selectedCollection}:</h3>
                {loading ? (
                  <p>Loading documents...</p>
                ) : documents.length === 0 ? (
                  <p>No documents found in this collection.</p>
                ) : (
                  <div className="documents-grid">
                    {documents.map((docItem) => (
                      <div key={docItem.id} className="document-card">
                        <div className="document-header">
                          <h4>Document ID: {docItem.id}</h4>
                          {permissions.write && (
                            <button 
                              className="delete-btn"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this document?')) {
                                  deleteDocument(docItem.id);
                                }
                              }}
                              disabled={!permissions.write}
                              title="Delete Document"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <div className="document-body">
                          <pre>{JSON.stringify(docItem, null, 2)}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DatabaseTest;
