// Aegis MCP Server - Insight Log Resource
// Provides access to the Aegis insight log

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const formatting = require('../lib/formatting');

/**
 * Get insights from the Aegis insight log
 * @param {object} params - Resource parameters
 * @param {number} params.limit - Maximum number of insights to retrieve
 * @param {string} params.category - Filter insights by category (code, process, spirit, other)
 * @param {string} params.tag - Filter insights by tag
 * @param {boolean} params.recent - If true, return most recent insights; if false, return oldest
 * @returns {object} - Filtered insights
 */
async function getInsights(params = {}) {
  try {
    // Get parameters with defaults
    const limit = params.limit ? parseInt(params.limit, 10) : 10;
    const category = params.category?.toLowerCase();
    const tag = params.tag?.toLowerCase();
    const recent = params.recent !== false; // Default to true
    
    // Get the path to the insight log
    const insightLogPath = path.resolve(__dirname, '..', config.paths.insightLog);
    
    // Check if the insight log exists
    let content = '';
    try {
      content = await fs.readFile(insightLogPath, 'utf-8');
    } catch (error) {
      // If the file doesn't exist, return an empty result
      return {
        insights: [],
        count: 0,
        filters: { limit, category, tag, recent }
      };
    }
    
    // Parse the insight log
    const insights = parseInsightLog(content);
    
    // Apply filters
    let filteredInsights = [...insights];
    
    // Filter by category
    if (category) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.category?.toLowerCase() === category
      );
    }
    
    // Filter by tag
    if (tag) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.tags?.some(t => t.toLowerCase() === tag)
      );
    }
    
    // Sort by date
    filteredInsights.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return recent 
        ? new Date(b.date) - new Date(a.date)
        : new Date(a.date) - new Date(b.date);
    });
    
    // Apply limit
    if (limit > 0) {
      filteredInsights = filteredInsights.slice(0, limit);
    }
    
    // Return the filtered insights
    return {
      insights: filteredInsights,
      count: filteredInsights.length,
      total: insights.length,
      filters: { limit, category, tag, recent }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve insights: ${error.message}`);
  }
}

/**
 * Parse the insight log content into an array of insight objects
 * @param {string} content - The insight log content
 * @returns {Array<object>} - Parsed insights
 */
function parseInsightLog(content) {
  // Split the content by insight separator
  const insightSeparator = /\n---\n/g;
  const insightBlocks = content.split(insightSeparator);
  
  // Skip the header block
  const insights = [];
  for (let i = 1; i < insightBlocks.length; i++) {
    const block = insightBlocks[i].trim();
    if (!block) continue;
    
    // Parse the insight
    const insight = parseInsightBlock(block);
    if (insight) {
      insights.push(insight);
    }
  }
  
  return insights;
}

/**
 * Parse an individual insight block
 * @param {string} block - The insight block text
 * @returns {object|null} - Parsed insight or null if invalid
 */
function parseInsightBlock(block) {
  // Regular expression to extract date, category, and tags
  const headerRegex = /^\*\((\d{2}\/\d{2}\/\d{4})\)\* - (?:\*\*([^*]+)\*\*)?(?: \[([^\]]+)\])?/;
  const match = block.match(headerRegex);
  
  if (!match) {
    // Try simpler format
    const simpleDateRegex = /^\*\((\d{2}\/\d{2}\/\d{4})\)\* - (.+)$/m;
    const simpleMatch = block.match(simpleDateRegex);
    
    if (simpleMatch) {
      const [, date, content] = simpleMatch;
      return {
        date,
        content: content.trim(),
        rawBlock: block
      };
    }
    
    return null;
  }
  
  const [, date, category, tagString] = match;
  
  // Extract the content (everything after the first line)
  const contentStart = block.indexOf('\n');
  const content = contentStart > -1 
    ? block.substring(contentStart).trim() 
    : '';
  
  // Parse tags
  const tags = tagString ? 
    tagString.split(',').map(tag => tag.trim()) : 
    [];
  
  // Return the parsed insight
  return {
    date,
    category: category || 'other',
    tags,
    content,
    rawBlock: block
  };
}

/**
 * Get insight categories and their counts
 * @returns {Promise<object>} - Categories and counts
 */
async function getInsightCategories() {
  try {
    // Get all insights
    const allInsights = await getInsights({ limit: 0 });
    
    // Count insights by category
    const categoryCounts = {};
    allInsights.insights.forEach(insight => {
      const category = insight.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    return {
      categories: categoryCounts,
      total: allInsights.insights.length
    };
  } catch (error) {
    throw new Error(`Failed to get insight categories: ${error.message}`);
  }
}

/**
 * Get insight tags and their counts
 * @returns {Promise<object>} - Tags and counts
 */
async function getInsightTags() {
  try {
    // Get all insights
    const allInsights = await getInsights({ limit: 0 });
    
    // Count insights by tag
    const tagCounts = {};
    allInsights.insights.forEach(insight => {
      if (!insight.tags) return;
      
      insight.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return {
      tags: tagCounts,
      total: Object.keys(tagCounts).length
    };
  } catch (error) {
    throw new Error(`Failed to get insight tags: ${error.message}`);
  }
}

module.exports = {
  getInsights,
  getInsightCategories,
  getInsightTags
};
