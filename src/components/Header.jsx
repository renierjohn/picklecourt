import { Link } from 'react-router-dom';
import '../styles/components/header.scss';

export const Header = () => {
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
            <Link to="/admin" className="nav-link">Admin</Link>
          </nav>
        </div>
      </div>
    </header>
  );
};
