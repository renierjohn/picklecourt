addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

// Define the event listener that handles the 'scheduled' event
addEventListener('scheduled', event => {
  // Use event.waitUntil() to keep the Worker alive until the promise resolves.
  // This is crucial for scheduled tasks to ensure the work completes.
  event.waitUntil(handleScheduled(event));
});

// Handle scheduled events
async function handleScheduled(event) {
  try {
    const ai_promt = await AI_RESPONSES.get('AI_PROMT');
    const success = await perforLLMGeneration(ai_promt);
    if (success) {
      console.log("[Cron Task] Daily cleanup completed successfully.");
    } else {
      console.error("[Cron Task] Daily cleanup failed.");
    }
  } catch (error) {
    console.error(`[Cron Task] Error during task execution: ${error}`);
  }
}

// Placeholder function for the actual background work
async function perforLLMGeneration(ai_promt = 'Write 3 random trivia about Pickleball. And just write directly the answer with ordered list.') {
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const payload = {
    contents: [
      {
        parts: [
          { text: ai_promt },
        ],
      },
    ],
  };

  let apiResponse;
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY, // Use the secret from env
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${await response.text()}`);
    }

    apiResponse = await response.json();
  } catch (error) {
    console.error("Gemini API POST request failed:", error);
    // Log the error and stop execution for this scheduled run
    return;
  }

  const generatedText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "No content generated.";
  try {
    await AI_RESPONSES.put('AI_MESSAGE', generatedText);
  } catch (error) {}

  return true;
}

async function handleRequest(request) {
  const { cf } = request;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
      status: status,
    });
  };

  // Handle OPTIONS preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // Cache preflight response for 24 hours
      },
    });
  }

  // Handle API routes
  if (path.startsWith('/api/')) {
    const apiPath = path.replace('/api', '');
    if (apiPath === '/validate') {
      if (method === 'POST') {
        const token = request.headers.get('Authorization');
        const isValid = await validateToken(token, RECAPTCHA_SECRET_KEY);
        return jsonResponse({ status: isValid ? 'success' : 'error', response: isValid }, isValid ? 200 : 400);
      }
    }
    if (apiPath === '/validate/hidden') {
      if (method === 'POST') {
        const token = request.headers.get('Authorization');
        const isValid = await validateToken(token, RECAPTCHA_HIDDEN_SECRET_KEY);
        return jsonResponse({ status: isValid ? 'success' : 'error', response: isValid }, isValid ? 200 : 400);
      }
    }
    if (apiPath === '/notify/slack/confirm') {
      if (method === 'POST') {
        const token = request.headers.get('Authorization');
        const body = await request.json();
        const isValid = await validateToken(token, RECAPTCHA_HIDDEN_SECRET_KEY);
        const message = {
          booking_url: `${ENV_DOMAIN}/bookings/?t=${body.transactionId}`,
          booking_host_name: body.owner.name,
          booking_court: body.courtName,
          booking_date: body.date,
          booking_time: body.times,
          booking_amount: body.totalPrice,
          booking_status: 'Confirmed'
        }
        if (isValid) {
           await handleSlackSendMessage(message, SLACK_MAIN_URI);
          return jsonResponse({ status: 'success' }, 200);
        }
      }
    }
    if (apiPath === '/notify/slack/delete') {
      if (method === 'POST') {
        const token = request.headers.get('Authorization');
        const body = await request.json();
        const isValid = await validateToken(token, RECAPTCHA_HIDDEN_SECRET_KEY);
        const message = {
          booking_url: `${ENV_DOMAIN}/bookings/?t=${body.transactionId}`,
          booking_host_name: body.owner.name,
          booking_court: body.courtName,
          booking_date: body.date,
          booking_time: body.times,
          booking_amount: body.totalPrice,
          booking_status: 'Deleted'
        }
        if (isValid) {
           await handleSlackSendMessage(message, SLACK_MAIN_URI);
          return jsonResponse({ status: 'success' }, 200);
        }
      }
    }
    if (apiPath === '/notify/slack') {
      if (method === 'POST') {
        const token = request.headers.get('Authorization');
        const body = await request.json();
        const isValid = await validateToken(token, RECAPTCHA_SECRET_KEY);
        const message = {
          booking_url: `${ENV_DOMAIN}/bookings/?t=${body.transactionId}`,
          booking_host_name: body.owner.name,
          booking_court: body.courtName,
          booking_date: body.date,
          booking_time: body.times,
          booking_amount: body.totalPrice,
          booking_status: 'Pending'
        }
        if (isValid) {
           await handleSlackSendMessage(message, SLACK_MAIN_URI);
          return jsonResponse({ status: 'success' }, 200);
        }
      }
    }
    if (apiPath === '/llm') {
      if (method === 'GET') {
        const response = await AI_RESPONSES.get('AI_MESSAGE');
        console.log(response);
        return jsonResponse({ status: 'success', response: response }, 200);
      }
    }
    if (apiPath === '/map') {
      if (method === 'GET') {
        return jsonResponse({ status: 'success', response: {zip: cf.postalCode, country: cf.country, city: cf.city, timezone: cf.timezone} }, 200);
      }
    }
    // Add more API endpoints as needed
    return jsonResponse({ error: 'Not Found' }, 404);
  }

  if (path === '/upload-image') {
    if (method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
          return jsonResponse({ error: 'No file uploaded' }, 400);
        }

        const specificDate = new Date();
        const year = specificDate.getFullYear();
        const month = padZero(specificDate.getMonth() + 1);
        const day = padZero(specificDate.getDate());
        const formattedDate = `${year}-${month}-${day}`;
        const filename = `${formattedDate}-${generateTimestampedFilename(file.name)}`;
        await R2_BUCKET.put(filename, file.stream());
        const publicUrl =  `/images/${filename}`;
        return jsonResponse({ url: publicUrl, filename: filename }, 200);
      } catch (e) {
        console.error('Error uploading image:', e);
        return jsonResponse({ error: 'Failed to upload image' }, 500);
      }
    } else {
      return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }
  }

  if (path.startsWith(`/images/`)) {
    if (method === 'GET') {
      const filename = path.substring(`/images/`.length);
      try {
        const object = await R2_BUCKET.get(filename);

        if (object === null) {
          return new Response('Object Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, { headers });
      } catch (e) {
        console.error('Error fetching image from R2:', e);
        return new Response('Failed to retrieve image', { status: 500 });
      }
    } else {
      return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }
  }
    // For all other routes, serve the React app (handles client-side routing)
  return serveStaticFile(path);

  function padZero(num) {
    return num < 10 ? `0${num}` : `${num}`;
  }

  /**
   * Handle incoming Telegram Update (a message, a command, etc.)
   * @param {object} update - The JSON object received from Telegram's webhook.
   * @param {string} token - The Bot Token stored as a secret.
   * @returns {Promise<Response>}
   */
  async function handleSlackSendMessage(message, url) {
    const payload = {
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            // "text": ":tennis: *Booking Notification* \n\n Someone Booked"
            "text": `:tennis: *${message.booking_host_name} - ${message.booking_court}* \n\n *Status*: \`${message.booking_status}\` \n\n *Booking Date*: \`${message.booking_date}\` \n\n *Booking Time*: \`${message.booking_time}\` \n\n *Booking Amount*: \`PHP ${message.booking_amount}\``
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Booking Details Here"
              },
              "url": message.booking_url
            }
          ]
        }
      ]
    }

    await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    return new Response('OK', { status: 200 });
  }

  /**
   * Utility function to replace the base filename with a Unix timestamp
   * while preserving the original file extension.
   *
   * This is useful for creating unique, non-colliding R2 object keys.
   *
   * @param {string} originalFilename - The original name of the file (e.g., "my_photo.jpg").
   * @returns {string} The new, timestamped filename (e.g., "1731178650000.jpg").
   */
  function generateTimestampedFilename(originalFilename) {
      if (!originalFilename || typeof originalFilename !== 'string') {
          throw new Error("Invalid filename provided.");
      }
      // 1. Get the current Unix timestamp in milliseconds
      const timestamp = Date.now();
      // 2. Find the position of the last dot (.) to separate the extension
      const dotIndex = originalFilename.lastIndexOf('.');
      let extension = '';
      // Check if an extension exists
      if (dotIndex !== -1 && dotIndex < originalFilename.length - 1) {
          extension = originalFilename.substring(dotIndex);
      }      
      return `${timestamp}${extension}`;
  }

  async function validateToken(recaptchaToken, recaptchaSecretToken) {    
    if (!recaptchaToken) {
      return new Response(JSON.stringify({ success: false, error: 'Token missing' }), { status: 400 });
    }
    // 1. Prepare the verification request payload
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    
    const params = new URLSearchParams();
    params.append('secret', recaptchaSecretToken); // Secure key from Worker environment
    params.append('response', recaptchaToken);
    
    // Optional: Get the client's IP to improve verification accuracy
    const clientIP = request.headers.get('CF-Connecting-IP'); 
    if (clientIP) {
        params.append('remoteip', clientIP); 
    }

    // 2. Send the request to Google
    const response = await fetch(verificationURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();
    if (result.success) {
      return true;
    }
    return false;
  }

   // Helper function to serve static files
  async function serveStaticFile(path) {
    // Remove leading slash if present
    const filePath = path.startsWith('/') ? path.slice(1) : path;
    // Default to index.html for root path or client-side routes
    const assetPath = filePath === '' || !filePath.includes('.') ? 'index.html' : filePath;
    // In a real deployment, you would fetch the file from your static assets
    // For development, we'll serve a simple response
    if (assetPath === 'index.html') {
      return new Response(
        `<!DOCTYPE html>
         <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>PickleBall Courts - Book Your Game Online | Reserve Now</title>
            <meta name="description" content="Another Dink, Another Day. Book your PickleBall court online. Easy, fast, and secure court reservations for PickleBall enthusiasts. Reserve your court in just a few clicks!">
            <meta name="keywords" content="Another Dink, Another Day.  pickleball, court booking, pickleball court, sports reservation, book pickleball court, pickleball game, pickleball philippines">
            <meta name="author" content="PickleBall Courts">
            <meta name="robots" content="index, follow">
            <meta name="googlebot" content="index, follow">
            <meta name="google-adsense-account" content="ca-pub-6514982182382718">
            <!-- Favicon -->
            <link rel="icon" href="/favicon.png" sizes="any">
            <link rel="icon" href="/favicon.svg" type="image/svg+xml">
            <link rel="apple-touch-icon" href="/apple-touch-icon.png">
            <link rel="manifest" href="/site.webmanifest">
            <meta name="theme-color" content="#2E7D32">

            <!-- Open Graph / Facebook -->
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://events-ph.com/" />
            <meta property="og:title" content="PickleBall Courts - Book Your Game Online" />
            <meta property="og:description" content="Another Dink, Another Day. Book your PickleBall court online. Easy, fast, and secure court reservations for PickleBall enthusiasts." />
            <meta property="og:image" content="https://s3.events-ph.com/2025-11-09-1762680660368.png" />
            <meta property="og:site_name" content="PickleBall Courts" />

            <!-- Twitter -->
            <meta name="twitter:card" content="summary_large_image">
            <meta name="twitter:title" content="Another Dink, Another Day. PickleBall Courts - Book Your Game Online">
            <meta name="twitter:description" content="Book your PickleBall court online. Easy, fast, and secure court reservations for PickleBall enthusiasts.">
            <meta name="twitter:image" content="https://s3.events-ph.com/2025-11-09-1762680660368.png">

            <!-- Canonical URL -->
            <link rel="canonical" href="https://events-ph.com/" />

            <!-- Schema.org markup for Google -->
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "SportsActivityLocation",
              "name": "PickleBall Courts",
              "description": "Book your PickleBall court online. Easy, fast, and secure court reservations for PickleBall enthusiasts.",
              "url": "https://events-ph.com",
              "logo": "https://events-ph.com/favicon.png",
              "image": "https://s3.events-ph.com/2025-11-09-1762680660368.png",
              "telephone": "+1234567890",
              "priceRange": "Php 200 - 500",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "123 Court Street",
                "addressLocality": "NIR",
                "addressRegion": "NIR",
                "postalCode": "6217",
                "addressCountry": "PH"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": "9.1939925",
                "longitude": "123.2666456"
              },
              "openingHoursSpecification": [
                {
                  "@type": "OpeningHoursSpecification",
                  "dayOfWeek": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                  ],
                  "opens": "08:00",
                  "closes": "17:00"
                }
              ],
              "sameAs": [
                "https://www.facebook.com/pickleball.courts.renify"
              ]
            }
            </script>
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6514982182382718"
     crossorigin="anonymous"></script>
            <!-- Google Fonts -->
            <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/assets/index.js"></script>
            <link rel="stylesheet" href="/assets/index.css">
          </body>
        </html>`, 
        {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
    
    // For other static files, return 404 in development
    // In production, these would be served by the static file server
    return new Response('Not Found', { 
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
