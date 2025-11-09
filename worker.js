addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request, event.env));
});

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Helper function to create a JSON response
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
        // 2. Extract the components from the Date object
        const year = specificDate.getFullYear();

        // Date.getMonth() returns 0 for January, so we add 1, then pad.
        const month = padZero(specificDate.getMonth() + 1);

        // Date.getDate() returns the day of the month, then we pad.
        const day = padZero(specificDate.getDate());

        // 3. Combine the components into the "YYYY-MM-DD" format
        const formattedDate = `${year}-${month}-${day}`;

        // Generate a unique filename (e.g., using a timestamp and original name)
        const filename = `${formattedDate}-${generateTimestampedFilename(file.name)}`;
        // Upload to R2 (assuming R2_BUCKET is bound in your Worker environment)
        // You need to configure R2_BUCKET binding in your Cloudflare Worker settings.

        await R2_BUCKET.put(filename, file.stream());

        const publicUrl =  `/${ENV_ID}/images/${filename}`;

        return jsonResponse({ url: publicUrl, filename: filename }, 200);

      } catch (e) {
        console.error('Error uploading image:', e);
        return jsonResponse({ error: 'Failed to upload image' }, 500);
      }
    } else {
      return jsonResponse({ error: 'Method Not Allowed' }, 405);
    }
  }

  if (path.startsWith(`/${ENV_ID}/images/`)) {
    if (method === 'GET') {
      const filename = path.substring(`/${ENV_ID}/images/`.length);
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
          // Extract the extension (e.g., ".jpg" or ".png")
          extension = originalFilename.substring(dotIndex);
      }
      
      // 3. Combine the timestamp and the extension to create the new filename
      // The R2 key will look like "1731178650000.jpg"
      return `${timestamp}${extension}`;
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
        <html>
          <head>
            <title>Pickleball Courts</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
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
