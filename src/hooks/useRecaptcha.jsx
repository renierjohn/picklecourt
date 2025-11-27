import { useState, useCallback } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY, RECAPTCHA_HIDDEN_SITE_KEY } from '../config/recaptcha';

export const useRecaptcha = (action) => {
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaRef, setRecaptchaRef] = useState(null);

  const onRecaptchaChange = useCallback((token) => {
    setRecaptchaToken(token);
  }, []);

  const execute = useCallback(async () => {
    if (!recaptchaRef) {
      console.error('reCAPTCHA ref not available');
      return null;
    }
    return await recaptchaRef.executeAsync();
  }, [recaptchaRef]);

  const resetRecaptcha = useCallback(() => {
    if (recaptchaRef) {
      recaptchaRef.reset();
      setRecaptchaToken('');
    }
  }, [recaptchaRef]);

  const RecaptchaComponent = useCallback(
    () => (
      <div className="recaptcha-container">
        <ReCAPTCHA
          ref={(ref) => setRecaptchaRef(ref)}
          sitekey={RECAPTCHA_SITE_KEY}
          onChange={onRecaptchaChange}
          size="normal"
          data-action={action}
        />
      </div>
    ),
    [action, onRecaptchaChange]
  );

  const RecaptchaHiddenComponent = useCallback(
    () => (
      <div className="recaptcha-container">
        <ReCAPTCHA
          ref={setRecaptchaRef}
          sitekey={RECAPTCHA_HIDDEN_SITE_KEY}
          size="invisible"
          data-action={action}
        />
      </div>
    ),
    [action]
  );

  return {
    recaptchaToken,
    RecaptchaComponent,
    RecaptchaHiddenComponent,
    resetRecaptcha,
    execute
  };
};
