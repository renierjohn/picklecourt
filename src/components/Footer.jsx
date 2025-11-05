import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import '../styles/components/footer.scss';

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>PickleCourt</h2>
            <p>Your premier destination for pickleball court bookings</p>
          </div>
          
          <div className="footer-links">            
            <div className="footer-links-column">
              <h3>Legal</h3>
              <ul>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/cookies">Cookie Policy</a></li>
              </ul>
            </div>
            
            <div className="footer-links-column">
              <h3>Connect</h3>
              <div className="social-links">
                <a href="https://www.facebook.com/pickleball.courts.renify" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FaFacebookF />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <FaTwitter />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} PickleCourt. All rights reserved.</p>
          <div className="footer-legal">
            <a href="/terms">Terms of Service</a>
            <span>|</span>
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};