// Aegis MCP Server - Metrics Utilities
// Handles tracking, logging, and analytics for Aegis MCP server

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

// In-memory metrics store for the current session
const sessionMetrics = {
  startTime: new Date(),
  requests: 0,
  toolExecutions: {},
  resourceAccesses: {},
  errors: 0
};

/**
 * Log an incoming request
 * @param {http.IncomingMessage} req - The HTTP request object
 */
function logRequest(req) {
  sessionMetrics.requests++;
  
  // Optional: Log request details to a file if detailed logging is enabled
  // This is kept minimal for now to avoid excessive I/O
}

/**
 * Log a tool execution
 * @param {string} toolName - The name of the tool
 * @param {object} args - The arguments passed to the tool
 */
function logToolExecution(toolName, args) {
  // Increment tool execution count
  if (!sessionMetrics.toolExecutions[toolName]) {
    sessionMetrics.toolExecutions[toolName] = 0;
  }
  sessionMetrics.toolExecutions[toolName]++;
  
  // For sensitive tools like log_insight, we might want to record some metadata
  if (toolName === 'log_insight') {
    logInsightMetrics(args);
  }
}

/**
 * Log a resource access
 * @param {string} resourceUri - The URI of the accessed resource
 * @param {object} params - The parameters used for the resource request
 */
function logResourceAccess(resourceUri, params) {
  // Increment resource access count
  if (!sessionMetrics.resourceAccesses[resourceUri]) {
    sessionMetrics.resourceAccesses[resourceUri] = 0;
  }
  sessionMetrics.resourceAccesses[resourceUri]++;
}

/**
 * Log an error occurrence
 * @param {Error} error - The error object
 */
function logError(error) {
  sessionMetrics.errors++;
  
  // Consider writing severe errors to a dedicated log file
  console.error('[Aegis MCP Error]', error.message, error.details || '');
}

/**
 * Log metrics specific to insight collection
 * @param {object} insightArgs - The arguments for the log_insight tool
 */
async function logInsightMetrics(insightArgs) {
  // For privacy reasons, we don't log the full insight text but just metadata
  const category = insightArgs.category || 'other';
  const hasTags = Array.isArray(insightArgs.tags) && insightArgs.tags.length > 0;
  
  // Update category stats in session metrics
  if (!sessionMetrics.insightCategories) {
    sessionMetrics.insightCategories = {};
  }
  if (!sessionMetrics.insightCategories[category]) {
    sessionMetrics.insightCategories[category] = 0;
  }
  sessionMetrics.insightCategories[category]++;
}

/**
 * Get the current session metrics
 * @returns {object} - The current session metrics
 */
function getSessionMetrics() {
  // Calculate derived metrics
  const now = new Date();
  const uptime = (now - sessionMetrics.startTime) / 1000; // in seconds
  
  // Prepare metrics report
  return {
    startTime: sessionMetrics.startTime.toISOString(),
    currentTime: now.toISOString(),
    uptime: uptime,
    requests: sessionMetrics.requests,
    errors: sessionMetrics.errors,
    toolExecutions: sessionMetrics.toolExecutions,
    resourceAccesses: sessionMetrics.resourceAccesses,
    insightCategories: sessionMetrics.insightCategories || {}
  };
}

/**
 * Save current metrics to a log file
 * @returns {Promise<boolean>} - Resolves to true if successful
 */
async function saveMetricsToFile() {
  try {
    const metrics = getSessionMetrics();
    const metricsLogPath = config.paths.metricsLog;
    
    // Create directory if it doesn't exist
    const logDir = path.dirname(metricsLogPath);
    await fs.mkdir(logDir, { recursive: true });
    
    // Append metrics to log file
    const metricsJson = JSON.stringify(metrics, null, 2);
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const logEntry = `\n--- Metrics snapshot at ${timestamp} ---\n${metricsJson}\n\n`;
    
    await fs.appendFile(metricsLogPath, logEntry);
    return true;
  } catch (error) {
    console.error('Failed to save metrics:', error);
    return false;
  }
}

// Set up periodic metrics saving
let metricsSaveInterval = null;
function startPeriodicMetricsSaving(intervalMs = 3600000) { // Default: every hour
  if (metricsSaveInterval) {
    clearInterval(metricsSaveInterval);
  }
  
  // Save metrics periodically
  metricsSaveInterval = setInterval(() => {
    saveMetricsToFile().catch(error => {
      console.error('Error in periodic metrics saving:', error);
    });
  }, intervalMs);
  
  // Also save on process exit
  process.on('exit', () => {
    try {
      // Use sync methods since we're exiting
      const metrics = getSessionMetrics();
      const metricsJson = JSON.stringify(metrics, null, 2);
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logEntry = `\n--- Final metrics at ${timestamp} (process exit) ---\n${metricsJson}\n\n`;
      
      // Make sure the log directory exists
      const metricsLogPath = config.paths.metricsLog;
      const logDir = path.dirname(metricsLogPath);
      require('fs').mkdirSync(logDir, { recursive: true });
      
      // Append final metrics
      require('fs').appendFileSync(metricsLogPath, logEntry);
    } catch (error) {
      console.error('Error saving final metrics:', error);
    }
  });
}

// Initialize metrics
startPeriodicMetricsSaving();

module.exports = {
  logRequest,
  logToolExecution,
  logResourceAccess,
  logError,
  getSessionMetrics,
  saveMetricsToFile
};
