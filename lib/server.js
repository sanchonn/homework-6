/**
 * Hello application
 * RESTful JSON API
 * Listen port 3000
 * When someone POST his name in name='someone', APP return a welcome message in JSON format
 *
 */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { StringDecoder } = require('string_decoder');

const debug = require('util').debuglog('server');

// Import config
const config = require('./config');

// Instantiate the server module object
const server = {};

// Instantiate the HTTP server
server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});


// Instantiate the HTTPS server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

server.httpsServer = https.createServer(server.httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

// All the service logic for both the http and https server
server.unifiedServer = (req, res) => {
  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);
  // Get the path
  const { pathname } = parsedUrl;
  const trimmedPath = pathname.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the Headers as an object
  const { headers } = req;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler this request should go to. If one is not found return notFound handler
    let chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // If the request is within the public directory, use the public handler instead
    let payload = {};
    try {
      payload = JSON.parse(buffer);
    } catch (err) {
      debug(err);
    }
    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload,
    };

    try {
      // Route the request to the handler specified in the router
      chosenHandler(data, (statusCode, payload, contentType) => {
        server.processHandlerResponse(res, method, trimmedPath, statusCode, payload, contentType);
      });
    } catch (e) {
      debug(e);
      server.processHandlerResponse(res, method, trimmedPath, 500, { Error: 'An unkown error has occured' }, 'json');
    }
  });
};

// Process the response from the handler
server.processHandlerResponse = (res, method, trimmedPath, statusCode, payload, contentType) => {
  // Determine the type of response (fallback to JSON)
  contentType = typeof (contentType) === 'string' ? contentType : 'json';

  // Use the status code called back by the handler, or default to 200
  statusCode = typeof (statusCode) === 'number' ? statusCode : 200;
  if (statusCode === 200) {
    debug('\x1b[32m%s\x1b[0m', `${method}:${trimmedPath}`);
  } else {
    debug('\x1b[31m%s\x1b[0m', `${method}:${trimmedPath}`);
  }
  // Return the response-parts that are content-specific
  let payloadString = '';
  if (contentType === 'json') {
    res.setHeader('Content-Type', 'application/json');
    // Use the payload called back by the handle, or default to {}
    payload = typeof (payload) === 'object' ? payload : {};
    // Convert the payload to a string
    payloadString = JSON.stringify(payload);
  }
  // Return the response-parts that are common to all content-types
  res.writeHead(statusCode);
  res.end(payloadString);
};

// Handlers
const handlers = {};

/**
 * Hello handler
 * data - contain a user name
 * callback - function
*/
handlers.hello = (data, callback) => {
  // Console number of pid
  debug(`Event on pid ${process.pid}`);
  // Check method
  if (data.method.indexOf('post') > -1) {
    // Name
    const name = typeof (data.payload.name) === 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : 'anonymouse';
    // Return 200 'OK' status code and a payload object
    callback(200, { payload: `Hello, ${name} [${process.pid}]` }, 'json');
  } else {
    callback(405, { payload: `Method not allowed, use post [${process.pid}]` }, 'json');
  }
};

handlers.notFound = (name, callback) => {
  // Return 404 'NotFound' status code
  callback(404);
};

// Router
server.router = {
  hello: handlers.hello,
};


// Init script
server.init = () => {
  // Start http server
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m', `The server is listening on port ${config.httpPort} in ${config.envName} mode`);
  });

  // Start https server
  server.httpsServer.listen(config.httpsPort, () => {
    console.log('\x1b[35m%s\x1b[0m', `The https server is listening on port ${config.httpsPort} in ${config.envName} mode`);
  });
};

// Export the module
module.exports = server;
