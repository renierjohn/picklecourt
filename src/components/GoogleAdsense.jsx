import React, { useEffect } from 'react';

const GoogleAdsense = () => {
  useEffect(() => {
    // Load the Google AdSense script
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6514982182382718';
    script.async = true;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);

    // Initialize the ad
    const initAd = () => {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    };

    script.onload = initAd;

    return () => {
      // Cleanup
      if (script) {
        script.onload = null;
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="ad-container">
      {/* AdSense Ad Unit */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-6514982182382718"
        data-ad-slot="7455886019"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default GoogleAdsense;
