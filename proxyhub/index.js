const express = require('express');
const { createProxyMiddleware,responseInterceptor } = require('http-proxy-middleware');
const redis = require('redis');

const app = express();
const client = redis.createClient({ host: 'redis', port: 6379 });

const CACHE_DURATION = 60*30; // Number of seconds to cache requests
const MIN_REQUEST_TIME = 0; // Minimum request time in seconds to cache
const HOST_TARGET = ''

const RESERVED_ROUTES = ['/driesdries_keys', '/clear-cache'];

// Set up a middleware function that forwards incoming requests to another server
const proxyMiddleware = createProxyMiddleware({
  target: HOST_TARGET,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    if (req.method === 'POST') {
      let bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type','application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData)
    }
  },
  selfHandleResponse: true,
  onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
    // log original request and proxied request info
    // const exchange = `[DEBUG] ${req.method} ${req.path} -> ${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path} [${proxyRes.statusCode}]`;
    // console.log(exchange); // [DEBUG] GET / -> http://www.example.com [200]

    // log complete response
    const response = responseBuffer.toString('utf8');
    // console.log(response); // log response body

   const key = req.originalUrl;

if (proxyRes.statusCode == 200) {
  const data = response
  //  console.log("\tGot data from proxy \n\t"  + "\n====\n\n")

    client.setex(key, CACHE_DURATION, data, (err) => {
         if (err) console.log(`Error setting cache for ${key}: ${err}`);
         else console.log(`\tSet cache for ${key}`);
     });
}


    return responseBuffer;
  })

});

// Middleware function to cache requests that take longer than a specified amount of time
function cacheRequest(req, res, next) {
  const key = req.originalUrl;
  // Skip caching for reserved routes
  if (RESERVED_ROUTES.includes(key)) {
    return next();
  }

  client.get(key, (err, data) => {
    if (err) throw err;

    if (data) {
        console.log(`YES cache hit  for ${key}`);
      res.send(data);
    } else {
      console.log(`No  cache hit  for ${key}`);
      next();
    }
  });
}

app.use(express.json());

// Create an endpoint to show what keys are available in the Redis cache
app.get('/driesdries_keys', (req, res) => {
  client.keys('*', (err, keys) => {
    if (err) {
      res.send(err)
    }
    res.send(keys);
  });
});

app.delete('/clear-cache', (req, res) => {
  client.flushall((err, reply) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error clearing cache');
    }
    console.log('Cache cleared');
    return res.send('Cache cleared');
  });
});


// Use the cache middleware function for all incoming requests
app.use(cacheRequest);

// Use the proxy middleware function for all incoming requests
app.use('/', proxyMiddleware);



// Start the Express.js server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
