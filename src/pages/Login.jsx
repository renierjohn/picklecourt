import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { RECAPTCHA_ACTIONS } from '../config/recaptcha';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import GoogleAdsense from '../components/GoogleAdsense';
import '../styles/pages/auth.scss';

export const Login = () => {
  const { user, login, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');

  const { recaptchaToken, RecaptchaComponent, resetRecaptcha } = useRecaptcha(RECAPTCHA_ACTIONS.LOGIN);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(email, password, recaptchaToken);
      if (result.success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Failed to login');
        resetRecaptcha();
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          <div className="form-group">
            <RecaptchaComponent />
          </div>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="divider">
          <span>OR</span>
        </div>
        <div className="social-buttons">
          <button 
            className="btn-google"
            onClick={async (e) => {
              e.preventDefault();
              setError('');
              try {
                const result = await signInWithGoogle();
                if (result.success) {
                  const from = location.state?.from?.pathname || '/';
                  navigate(from, { replace: true });
                } else {
                  setError(result.error || 'Failed to login with Google');
                }
              } catch (err) {
                setError('An error occurred during Google login');
                console.error('Google login error:', err);
              }
            }}
          >
            <FaGoogle className="google-icon" />
            <span>Login with Google</span>
          </button>
          {/* <button 
            className="btn-facebook"
            onClick={async (e) => {
              e.preventDefault();
              setError('');
              try {
                const result = await signInWithFacebook();
                if (result.success) {
                  const from = location.state?.from?.pathname || '/';
                  navigate(from, { replace: true });
                } else {
                  setError(result.error || 'Failed to login with Facebook');
                }
              } catch (err) {
                setError('An error occurred during Facebook login');
                console.error('Facebook login error:', err);
              }
            }}
          >
            <FaFacebook className="facebook-icon" />
            <span>Login with Facebook</span>
          </button> */}
        </div>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      <GoogleAdsense />
      </div>
    </div>
  );
};
