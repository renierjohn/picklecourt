import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import '../styles/components/header.scss';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-text">Pickle</span>
            <span className="logo-highlight">Ball</span>
            <span className="logo-text">Courts</span>
          </Link>
          <nav className="nav">
            <Link to="/" className="nav-link">Home</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className="nav-link">Admin</Link>
            )}
            {user?.email === 'renify.official@gmail.com' && (
              <>
                <Link to="/users" className="nav-link">Users</Link>
                <Link to="/database-test" className="nav-link">Database Test</Link>
              </>
            )}
            {user ? (
              <>
                <span className="nav-link">Welcome, {user.name}</span>
                <button onClick={handleLogout} className="nav-link btn-link">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
