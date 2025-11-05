import { useState, useCallback } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { RECAPTCHA_SITE_KEY } from '../config/recaptcha';

export const useRecaptcha = (action) => {
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaRef, setRecaptchaRef] = useState(null);

  const onRecaptchaChange = useCallback((token) => {
    setRecaptchaToken(token);
  }, []);

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

  return {
    recaptchaToken,
    RecaptchaComponent,
    resetRecaptcha,
  };
};
