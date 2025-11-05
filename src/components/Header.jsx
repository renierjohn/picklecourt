import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import '../styles/components/header.scss';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest('.nav') && !event.target.closest('.menu-toggle')) {
        setIsMenuOpen(false);
      }
    };

    // Handle scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuOpen]);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
            <span className="logo-text">Pickle</span>
            <span className="logo-highlight">Ball</span>
            <span className="logo-text">Courts</span>
          </Link>
          
          <button 
            className="menu-toggle" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <nav className={`nav ${isMenuOpen ? 'active' : ''}`}>
            <div className="nav-links">
              <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              )}
              {user?.email === 'renify.official@gmail.com' && (
                <>
                  <Link to="/users" className="nav-link" onClick={() => setIsMenuOpen(false)}>Users</Link>
                  <Link to="/database-test" className="nav-link" onClick={() => setIsMenuOpen(false)}>Database Test</Link>
                </>
              )}
            </div>
            <Link to="/bookings" className="btn btn-login">My Bookings</Link>

            <div className="user-actions">
              {user ? (
                <>
                  <span className="welcome-message">Welcome, {user.name}</span>
                  <button onClick={handleLogout} className="btn btn-logout">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-login" onClick={() => setIsMenuOpen(false)}>Login as Host</Link>
                  <Link to="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Become Host</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};
