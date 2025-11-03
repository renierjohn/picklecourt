import { Link } from 'react-router-dom';
import '../styles/pages/unauthorized.scss';

const Unauthorized = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h1>403 - Unauthorized Access</h1>
        <p>You don't have permission to access this page.</p>
        <p>Please contact the administrator if you believe this is a mistake.</p>
        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Go to Home
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Login as Admin
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
