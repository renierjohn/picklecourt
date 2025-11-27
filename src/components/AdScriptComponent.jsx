import React, { useEffect, useRef } from 'react';

const AdScriptComponent = ({ adKey }) => {
  // Use a ref to ensure we only run the script insertion once per mount
  const isScriptLoaded = useRef(false);

  useEffect(() => {
    // Prevent script loading on subsequent re-renders
    if (isScriptLoaded.current) {
      return;
    }

    // 1. Define the global variable 'atOptions'
    window.atOptions = {
      'key': adKey || '303c882f225d2ef2a23446b622a10f55', // Use prop or default key
      'format': 'iframe',
      'height': 90,
      'width': 728,
      'params': {}
    };

    // 2. Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//www.highperformanceformat.com/${adKey || '303c882f225d2ef2a23446b622a10f55'}/invoke.js`;
    
    // Set a marker to prevent re-loading
    isScriptLoaded.current = true;

    // 3. Append the script to the body or head of the document
    document.body.appendChild(script);

    // 4. Cleanup function (optional but recommended for standard scripts)
    // Note: Ad scripts often manipulate the DOM outside the component,
    // so cleanup may not fully revert the ad, but it removes the script tag.
    return () => {
      document.body.removeChild(script);
      delete window.atOptions; // Clean up the global variable
    };
  }, [adKey]); // Re-run only if the adKey changes

  // The component doesn't render any visible elements itself, 
  // the script will insert the ad content.
  return <div className="ad-script-container" style={{ minHeight: '90px', width: '728px' }} />;
};

export default AdScriptComponent;
