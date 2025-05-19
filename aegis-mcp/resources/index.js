// Aegis MCP Server - Resource Exports
// Exports all available resources for the Aegis MCP server

const protocol = require('./protocol');
const insightLog = require('./insightLog');

/**
 * Available resources for the Aegis MCP server
 */
module.exports = {
  // Protocol resources
  aegis_protocol: protocol.getProtocol,
  
  // Insight log resources
  insight_log: insightLog.getInsights,
  insight_categories: insightLog.getInsightCategories,
  insight_tags: insightLog.getInsightTags
};
