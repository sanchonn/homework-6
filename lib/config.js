/**
 * Configuration file
 *
 */

// Init config object
const config = {};

// Staging config
config.staging = {
  httpPort: 3000,
  httpsPort: 3001,
  envName: 'staging',
};

// Production config
config.production = {
  httpPort: 5000,
  httpsPort: 5001,
  envName: 'production',
};

// Select currentEnvironment
const currentEnvironment = typeof (process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that current environment is one of the environment above, if not default the staging
const envToExport = typeof (config[currentEnvironment]) === 'object' ? config[currentEnvironment] : config.staging;

// Export selected config
module.exports = envToExport;
