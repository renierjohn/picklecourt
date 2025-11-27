// reCAPTCHA configuration
export const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY; // Replace with your actual reCAPTCHA site key
export const RECAPTCHA_HIDDEN_SITE_KEY = import.meta.env.VITE_RECAPTCHA_HIDDEN_SITE_KEY; // Replace with your actual reCAPTCHA secret key

export const RECAPTCHA_ACTIONS = {
  LOGIN: 'login',
  REGISTER: 'register',
  BOOKING: 'booking',
  ADMIN: 'admin'
};
