// Aegis MCP Server - Security Utilities
// Provides authentication, authorization, and security functions

const config = require('../config');

/**
 * Validate access to a specific tool
 * @param {string} toolName - The name of the tool being accessed
 * @param {object} requestData - The full request data
 * @returns {Promise<boolean>} - Resolves to true if access is allowed
 */
async function validateToolAccess(toolName, requestData) {
  // Skip validation if security is disabled
  if (!config.security.requireAuthentication && !config.security.accessControlEnabled) {
    return true;
  }
  
  // Token validation (if enabled)
  if (config.security.tokenValidation) {
    const token = requestData.token || '';
    if (!await validateToken(token)) {
      const error = new Error('Invalid or missing authentication token');
      error.details = { toolName, status: 'authentication_failed' };
      throw error;
    }
  }
  
  // Access control (if enabled)
  if (config.security.accessControlEnabled) {
    // Get client ID or use a default for unauthenticated requests
    const clientId = requestData.clientId || 'anonymous';
    
    if (!await checkToolPermission(clientId, toolName)) {
      const error = new Error(`Client ${clientId} does not have permission to use tool ${toolName}`);
      error.details = { toolName, clientId, status: 'authorization_failed' };
      throw error;
    }
  }
  
  return true;
}

/**
 * Validate access to a specific resource
 * @param {string} resourceUri - The URI of the resource being accessed
 * @param {object} requestData - The full request data
 * @returns {Promise<boolean>} - Resolves to true if access is allowed
 */
async function validateResourceAccess(resourceUri, requestData) {
  // Skip validation if security is disabled
  if (!config.security.requireAuthentication && !config.security.accessControlEnabled) {
    return true;
  }
  
  // Token validation (if enabled)
  if (config.security.tokenValidation) {
    const token = requestData.token || '';
    if (!await validateToken(token)) {
      const error = new Error('Invalid or missing authentication token');
      error.details = { resourceUri, status: 'authentication_failed' };
      throw error;
    }
  }
  
  // Access control (if enabled)
  if (config.security.accessControlEnabled) {
    // Get client ID or use a default for unauthenticated requests
    const clientId = requestData.clientId || 'anonymous';
    
    if (!await checkResourcePermission(clientId, resourceUri)) {
      const error = new Error(`Client ${clientId} does not have permission to access resource ${resourceUri}`);
      error.details = { resourceUri, clientId, status: 'authorization_failed' };
      throw error;
    }
  }
  
  return true;
}

/**
 * Validate an authentication token
 * @param {string} token - The authentication token to validate
 * @returns {Promise<boolean>} - Resolves to true if the token is valid
 */
async function validateToken(token) {
  // In a real implementation, this would validate against a token store or service
  // For the initial implementation, we'll use a simple check
  
  // Token validation is disabled for now
  if (!config.security.tokenValidation) {
    return true;
  }
  
  // Simple placeholder logic for token validation
  return token && token.length > 0;
}

/**
 * Check if a client has permission to use a specific tool
 * @param {string} clientId - The client identifier
 * @param {string} toolName - The name of the tool
 * @returns {Promise<boolean>} - Resolves to true if the client has permission
 */
async function checkToolPermission(clientId, toolName) {
  // In a real implementation, this would check against a permissions database
  // For the initial implementation, we'll use a simple check based on engagement levels
  
  // Access control is disabled for now
  if (!config.security.accessControlEnabled) {
    return true;
  }
  
  // Check if the tool is available at the client's engagement level
  // For now, we'll assume all clients have standard access
  const clientLevel = 'standard';
  const allowedTools = config.engagementLevels[clientLevel]?.features || [];
  
  return allowedTools.includes(toolName);
}

/**
 * Check if a client has permission to access a specific resource
 * @param {string} clientId - The client identifier
 * @param {string} resourceUri - The URI of the resource
 * @returns {Promise<boolean>} - Resolves to true if the client has permission
 */
async function checkResourcePermission(clientId, resourceUri) {
  // In a real implementation, this would check against a permissions database
  // For the initial implementation, we'll assume all resources are accessible
  
  // Access control is disabled for now
  if (!config.security.accessControlEnabled) {
    return true;
  }
  
  // For now, all resources are accessible to all authenticated clients
  return true;
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - The input to sanitize
 * @returns {string} - The sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Simple sanitization: remove any script tags or potentially harmful content
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, 'removed:');
}

module.exports = {
  validateToolAccess,
  validateResourceAccess,
  validateToken,
  checkToolPermission,
  checkResourcePermission,
  sanitizeInput
};
