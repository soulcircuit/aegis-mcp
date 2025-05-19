// Aegis MCP Server - Main Entry Point
// Implements the server for the Aegis Mutuality Protocol integration

const http = require('http');
const url = require('url');
const fs = require('fs/promises');
const path = require('path');

// Import tool and resource implementations
const tools = require('./tools');
const resources = require('./resources');

// Import utilities
const security = require('./lib/security');
const formatting = require('./lib/formatting');
const metrics = require('./lib/metrics');
const config = require('./config');

// Global constants
const PORT = process.env.AEGIS_PORT || 3545; // Default port for Aegis MCP
const LOGS_DIR = './logs';
const HOST = 'localhost';

// Tool definitions - map tool names to their handlers
const TOOLS = {
  'attune_to_aegis': tools.attune_to_aegis,
  'get_aegis_principles': tools.get_aegis_principles,
  'log_insight': tools.log_insight,
  'check_aegis_alignment': tools.check_aegis_alignment,
  'reflect_on_session': tools.reflect_on_session,
  'create_aegis_ritual': tools.create_aegis_ritual
};

// Resource definitions - map resource URIs to their handlers
const RESOURCES = {
  'aegis/protocol': resources.aegis_protocol,
  'aegis/insights': resources.insight_log,
  'aegis/insight-categories': resources.insight_categories,
  'aegis/insight-tags': resources.insight_tags
};

// Server logic
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Log request
    metrics.logRequest(req);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests (for CORS preflight)
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Handle MCP protocol requests
    if (pathname === '/mcp') {
      return handleMcpRequest(req, res);
    }

    // Handle status endpoint
    if (pathname === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'running', 
        version: '0.1.0',
        server: 'aegis-protocol',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Handle all other requests
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
  }
});

async function handleMcpRequest(req, res) {
  // Only handle POST requests for MCP
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    // Parse request body
    const body = await getRequestBody(req);
    const requestData = JSON.parse(body);

    // Validate request structure
    if (!requestData.type || !['tool', 'resource'].includes(requestData.type)) {
      throw new Error('Invalid request type. Must be "tool" or "resource"');
    }

    let response;
    
    // Handle tool calls
    if (requestData.type === 'tool') {
      if (!requestData.name || !TOOLS[requestData.name]) {
        throw new Error(`Unknown tool: ${requestData.name}`);
      }
      
      // Validate authentication/authorization
      await security.validateToolAccess(requestData.name, requestData);
      
      // Execute tool with arguments
      const toolHandler = TOOLS[requestData.name];
      const args = requestData.arguments || {};
      
      response = await toolHandler(args);
      metrics.logToolExecution(requestData.name, args);
    }
    // Handle resource requests
    else if (requestData.type === 'resource') {
      if (!requestData.uri || !RESOURCES[requestData.uri]) {
        throw new Error(`Unknown resource: ${requestData.uri}`);
      }
      
      // Validate authentication/authorization
      await security.validateResourceAccess(requestData.uri, requestData);
      
      // Get resource with parameters
      const resourceHandler = RESOURCES[requestData.uri];
      const params = requestData.parameters || {};
      
      response = await resourceHandler(params);
      metrics.logResourceAccess(requestData.uri, params);
    }

    // Send successful response
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      result: formatting.formatResponse(response)
    }));
  } catch (error) {
    console.error('MCP request error:', error);
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'error',
      error: error.message,
      details: error.details || null
    }));
  }
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', reject);
  });
}

// Ensure logs directory exists before starting server
async function ensureLogsDirectory() {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
    console.log(`Ensured logs directory exists: ${LOGS_DIR}`);
  } catch (error) {
    console.error(`Error ensuring logs directory ${LOGS_DIR}:`, error);
    // Depending on severity, could exit or continue without logging
  }
}

// Start the server
async function startServer() {
  await ensureLogsDirectory(); // Ensure logs directory before starting

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Error: Port ${PORT} is already in use.`);
      console.error('Please close the application using the port or configure Aegis MCP to use a different port.');
      process.exit(1); // Exit with an error code
    } else {
      console.error('Server error:', error);
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`🌱 Aegis MCP Server running at http://${HOST}:${PORT}/`);
    console.log(`Status endpoint: http://${HOST}:${PORT}/status`);
  
  // Log available tools
  console.log('\nAvailable Aegis tools:');
  Object.keys(TOOLS).forEach(tool => console.log(`- ${tool}`));
  
    // Log available resources
    console.log('\nAvailable Aegis resources:');
    Object.keys(RESOURCES).forEach(resource => console.log(`- ${resource}`));
  });
}

// Start the server
startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing Aegis MCP server');
  server.close(() => {
    console.log('Aegis MCP server closed');
  });
});
