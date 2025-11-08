import { useEffect } from 'react';

const MessengerChat = () => {
  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      window.FB.init({
        xfbml: true,
        version: 'v18.0'
      });
    };

    // Load the SDK asynchronously
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Add the chat plugin container
    const chatDiv = document.createElement('div');
    chatDiv.className = 'fb-customerchat';
    chatDiv.setAttribute('page_id', '111269985010635'); // Replace with your Facebook Page ID
    chatDiv.setAttribute('attribution', 'biz_inbox');
    chatDiv.setAttribute('theme_color', '#4a90e2');
    chatDiv.setAttribute('logged_in_greeting', 'Hi! How can we help you today?');
    chatDiv.setAttribute('logged_out_greeting', 'Hi! How can we help you today?');
    
    document.body.appendChild(chatDiv);

    // Cleanup
    return () => {
      const chatPlugin = document.querySelector('.fb-customerchat');
      if (chatPlugin) {
        chatPlugin.remove();
      }
      delete window.FB;
    };
  }, []);

  return null; // This component doesn't render anything
};

export default MessengerChat;
