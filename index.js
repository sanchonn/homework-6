/**
 * Primary file for the API
 *
 */

// Dependencies
const cluster = require('cluster');
const os = require('os');

// Number of CPUs in the system
const numCPUs = os.cpus().length;
// Load server library
const server = require('./lib/server');


// Declare the app
const app = {};

// Init function
app.init = () => {
  if (cluster.isMaster) {
    // Fork the process
    for (let i = 0; i < numCPUs; i += 1) {
      const worker = cluster.fork();
      // Listener for process event
      worker.on('exit', (code, signal) => {
        if (signal) {
          console.log(`worker was killed by signal: ${signal}`);
        } else if (code !== 0) {
          console.log(`worker exited with error code: ${code}`);
        } else {
          console.log('worker success!');
        }
      });
    }
  } else {
    // If we're not on the master thread, start the HTTP server
    server.init();
  }
};

// Start application
app.init();
