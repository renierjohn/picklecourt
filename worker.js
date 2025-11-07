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
    
    // Authentication endpoints
    // if (method === 'POST' && apiPath === '/login') {
    //   const { email, password } = await request.json();
      
    //   // Demo authentication - replace with your actual authentication logic
    //   if (email === 'admin@example.com' && password === 'admin123') {
    //     return jsonResponse({
    //       user: {
    //         id: 1,
    //         email: 'admin@example.com',
    //         name: 'Admin User',
    //         role: 'admin',
    //         token: 'demo-jwt-token-12345'
    //       }
    //     });
    //   } else {
    //     return jsonResponse({ error: 'Invalid credentials' }, 401);
    //   }
    // }

    // if (method === 'POST' && apiPath === '/register') {
    //   const { name, email, password } = await request.json();
      
    //   // Demo registration - replace with your actual registration logic
    //   return jsonResponse({
    //     user: {
    //       id: Date.now(),
    //       email,
    //       name,
    //       role: 'user',
    //       token: 'demo-jwt-token-' + Math.random().toString(36).substr(2, 9)
    //     }
    //   }, 201);
    // }

    // if (method === 'POST' && apiPath === '/logout') {
    //   return jsonResponse({ message: 'Logged out successfully' });
    // }

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

        // Generate a unique filename (e.g., using a timestamp and original name)
        const filename = `${Date.now()}-${encodeURIComponent(file.name)}`;
        // Upload to R2 (assuming R2_BUCKET is bound in your Worker environment)
        // You need to configure R2_BUCKET binding in your Cloudflare Worker settings.

        await R2_BUCKET.put(filename, file.stream());

        const publicUrl = `/images/${filename}`;

        return jsonResponse({ url: publicUrl }, 200);

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
