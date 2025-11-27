// src/components/TawkMessenger.jsx
import { useEffect } from 'react';

const TawkMessenger = ({ embedUrl }) => {
  useEffect(() => {
    // Create script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      s1.async=true;
      s1.src='${embedUrl}';
      s1.charset='UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    `;

    // Append to body
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      const tawkScript = document.querySelector('script[src*="tawk.to"]');
      if (tawkScript) {
        tawkScript.remove();
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default TawkMessenger;