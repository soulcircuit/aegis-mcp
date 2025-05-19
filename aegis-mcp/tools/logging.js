// Aegis MCP Server - Logging Tools
// Provides tools for logging insights and reflections

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const formatting = require('../lib/formatting');

/**
 * Log an insight to the Aegis insight log
 * @param {object} args - Tool arguments
 * @param {string} args.insight - The insight text to log
 * @param {string} args.category - Category of the insight (code, process, spirit, other)
 * @param {Array<string>} args.tags - Tags to associate with the insight
 * @returns {object} - Result of the logging operation
 */
async function logInsight(args) {
  try {
    // Validate required parameters
    if (!args.insight) {
      throw new Error('Missing required parameter: insight');
    }
    
    // Get category from args or use default
    const category = args.category || config.defaultParameters.log_insight.category;
    // Get tags from args or use default
    const tags = args.tags || config.defaultParameters.log_insight.tags;
    
    // Validate category
    const validCategories = ['code', 'process', 'spirit', 'other'];
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}. Must be one of: ${validCategories.join(', ')}`);
    }
    
    // Format the insight for logging
    const formattedInsight = formatting.formatInsight(args.insight, category, tags);
    
    // Get the path to the insight log
    const insightLogPath = path.resolve(__dirname, '..', config.paths.insightLog);
    
    // Ensure the directory exists
    const logDir = path.dirname(insightLogPath);
    await fs.mkdir(logDir, { recursive: true });
    
    // Check if the insight log exists, if not create it with a header
    let fileExists = false;
    try {
      await fs.access(insightLogPath);
      fileExists = true;
    } catch (error) {
      // File doesn't exist
    }
    
    // Create or update the insight log
    if (!fileExists) {
      // Create a new insight log with a header
      const header = `# Aegis Insight Log ✨\n\nA living space to capture moments of learning, friction, inspiration, and joy during our co-creation.\n\n---\n`;
      await fs.writeFile(insightLogPath, header);
    }
    
    // Append the insight to the log
    await fs.appendFile(insightLogPath, formattedInsight.markdownEntry);
    
    // Return success response
    return {
      success: true,
      insight: formattedInsight.content,
      timestamp: formattedInsight.timestamp,
      category,
      tags: formattedInsight.tags
    };
  } catch (error) {
    throw new Error(`Failed to log insight: ${error.message}`);
  }
}

/**
 * Get the categories for insights
 * @returns {Array<string>} - Valid insight categories
 */
function getInsightCategories() {
  return ['code', 'process', 'spirit', 'other'];
}

/**
 * Format an insight for logging
 * @param {string} insight - Insight text
 * @param {string} category - Category of insight
 * @param {Array<string>} tags - Tags for the insight
 * @returns {string} - Formatted insight entry
 */
function formatInsightEntry(insight, category = 'other', tags = []) {
  const now = new Date();
  const dateString = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  let tagString = '';
  if (tags && tags.length > 0) {
    tagString = ` [${tags.join(', ')}]`;
  }
  
  return `\n---\n\n*(${dateString})* - **${category}**${tagString}\n\n${insight}\n`;
}

module.exports = {
  logInsight,
  getInsightCategories,
  formatInsightEntry
};
