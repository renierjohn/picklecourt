// reCAPTCHA configuration
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY; // Replace with your actual reCAPTCHA site key
export const RECAPTCHA_SECRET_KEY = import.meta.env.VITE_RECAPTCHA_SECRET_KEY; // This should be kept secure on the server side

export const RECAPTCHA_ACTIONS = {
  LOGIN: 'login',
  REGISTER: 'register',
  BOOKING: 'booking',
};
