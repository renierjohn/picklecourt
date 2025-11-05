import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { RECAPTCHA_ACTIONS } from '../config/recaptcha';
import { FaGoogle, FaFacebook } from 'react-icons/fa';
import '../styles/pages/auth.scss';

export const Register = () => {
  const { user, register, signInWithGoogle, signInWithFacebook, error: authError, setError: setAuthError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Set auth errors in component state
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      setAuthError('');
    };
  }, [setAuthError]);

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    const result = await signInWithGoogle();
    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else if (result.error) {
      setError(result.error);
    }
  };

  const handleFacebookSignIn = async (e) => {
    e.preventDefault();
    setError('');
    const result = await signInWithFacebook();
    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else if (result.error) {
      setError(result.error);
    }
  };

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const { recaptchaToken, RecaptchaComponent, resetRecaptcha } = useRecaptcha(RECAPTCHA_ACTIONS.REGISTER);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }

    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA verification');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await register(name, email, password, recaptchaToken);
      if (result.success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Failed to register');
        resetRecaptcha();
      }
    } catch (err) {
      setError('An error occurred during registration');
      console.error('Registration error:', err);
      resetRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="social-login">
          <button 
            type="button" 
            className="btn-social google"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <FaGoogle className="social-icon" />
            <span>Continue with Google</span>
          </button>
          <button 
            type="button" 
            className="btn-social facebook"
            onClick={handleFacebookSignIn}
            disabled={isLoading}
          >
            <FaFacebook className="social-icon" />
            <span>Continue with Facebook</span>
          </button>
        </div>
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>
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
              minLength="6"
              placeholder="Enter your password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
              placeholder="Confirm your password"
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
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};
