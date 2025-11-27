import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { RECAPTCHA_ACTIONS } from '../config/recaptcha';
import { FaGoogle, FaFacebook, FaMoneyBill } from 'react-icons/fa';
import GoogleAdsense from '../components/GoogleAdsense';
import '../styles/pages/auth.scss';

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();


  const { user, register, signInWithGoogle, signInWithFacebook, error: authError, setError: setAuthError } = useAuth();
  const { recaptchaToken, RecaptchaComponent, resetRecaptcha } = useRecaptcha(RECAPTCHA_ACTIONS.REGISTER);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    const plan = searchParams.get('plan') || 'free';
    const result = await signInWithGoogle(plan = 'free');
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
    const plan = searchParams.get('plan') || 'free';
    const result = await signInWithFacebook();
    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else if (result.error) {
      setError(result.error);
    }
  };

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
      const plan = searchParams.get('plan') || 'free'; 
      const result = await register(name, email, password, recaptchaToken, plan);
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

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

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

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Become a Host</h2>
        <p style={{
          textAlign: 'center',
          color: '#4a90e2',
          fontSize: '1.1rem',
          fontWeight: '500',
          margin: '0.5rem 0 1.5rem',
          display: 'inline-block',
          marginLeft: '50%',
          transform: 'translateX(-50%)'
        }}>With FREE 6 Month Service</p>
        {error && <div className="error-message">{error}</div>}
        <div className="social-login">
          <GoogleAdsense />
          <button 
            type="button" 
            className="btn-social pricing"
            onClick={() => navigate('/pricing')}
            disabled={isLoading}
          >
            <FaMoneyBill className="social-icon" />
            <span>View Pricing</span>
          </button>
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
      <GoogleAdsense />
      </div>
    </div>
  );
};
