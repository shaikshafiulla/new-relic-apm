'use strict';
module.exports = {
  app_name: [process.env.NEW_RELIC_APP_NAME], // Use env variable
  license_key: process.env.NEW_RELIC_LICENSE_KEY, // Use env variable
  logging: {
    level: 'info',
    filepath: 'newrelic_agent.log'
  },
  allow_all_headers: true,
  attributes: {
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'response.headers.cookie',
      'response.headers.authorization'
    ]
  },
  // Add distributed tracing for better DB monitoring
  distributed_tracing: {
    enabled: true
  }
};