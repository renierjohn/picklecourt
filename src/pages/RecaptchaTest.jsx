import { useState, useEffect } from 'react';
import { useRecaptcha } from '../hooks/useRecaptcha';
import { RECAPTCHA_ACTIONS } from '../config/recaptcha';

export const RecaptchaTest = () => {
  const { recaptchaToken, RecaptchaComponent } = useRecaptcha(RECAPTCHA_ACTIONS.BOOKING);
  const { RecaptchaHiddenComponent, execute } = useRecaptcha(RECAPTCHA_ACTIONS.ADMIN);
  const [validationResult, setValidationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleValidate = async () => {
    if (!recaptchaToken) {
      setError('Please complete the reCAPTCHA');
      return;
    }

    setIsLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_WORKER_URL}/api/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${recaptchaToken}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Validation failed');
      }

      setValidationResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during validation');
      console.error('Validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  const handleHiddenValidate = async () => {
    if (!token) {
      setError('Please complete the reCAPTCHA');
      return;
    }

    setIsLoading(true);
    setError('');
    setValidationResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_WORKER_URL}/api/validate/hidden`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Validation failed');
      }

      setValidationResult(data);
    } catch (err) {
      setError(err.message || 'An error occurred during validation');
      console.error('Validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = await execute();
        if (token) {
          console.log('reCAPTCHA Token:', token);
          setToken(token);
          // Use the token as needed
        }
      } catch (error) {
        console.error('Error executing reCAPTCHA:', error);
      }
    };
    verifyToken();
  }, [isLoading, execute]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-6">reCAPTCHA Validation Test</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
        <div className="mb-4">
          <RecaptchaComponent />
          <RecaptchaHiddenComponent />
        </div>

        <button
          onClick={handleValidate}
          disabled={isLoading || !recaptchaToken}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white shadow-md transition-all duration-200 ease-in-out ${
            isLoading || !recaptchaToken
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Validating...
            </span>
          ) : (
            'Validate'
          )}
        </button>

      <button
          onClick={handleHiddenValidate}
          disabled={isLoading || !token}
          className={`w-full py-3 px-6 rounded-lg font-medium text-white shadow-md transition-all duration-200 ease-in-out ${
            isLoading || !token
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >Validate Hidden Recaptcha
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {validationResult && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold text-green-800 mb-2">Validation Successful!</h3>
            <pre className="bg-white p-2 rounded text-sm overflow-x-auto">
              {JSON.stringify(validationResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecaptchaTest;
