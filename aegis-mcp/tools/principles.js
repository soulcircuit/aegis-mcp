// Aegis MCP Server - Principles Tools
// Provides tools for accessing Aegis principles and practices

const config = require('../config');
const formatting = require('../lib/formatting');

/**
 * Get Aegis principles and/or practices
 * @param {object} args - Tool arguments
 * @param {string} args.which - Which aspect of Aegis to retrieve (principles, practices, all)
 * @param {string} args.filter - Term to filter principles/practices by
 * @returns {object} - Filtered principles and practices
 */
async function getPrinciples(args) {
  try {
    // Get which type to retrieve from args or use default
    const which = args.which || config.defaultParameters.get_aegis_principles.which;
    // Get filter from args or use default
    const filter = args.filter || config.defaultParameters.get_aegis_principles.filter;
    
    // Validate 'which' parameter
    if (!['principles', 'practices', 'all'].includes(which)) {
      throw new Error(`Invalid 'which' parameter: ${which}. Must be 'principles', 'practices', or 'all'.`);
    }
    
    // Select principles and/or practices based on 'which' parameter
    let principles = [];
    let practices = [];
    
    if (which === 'principles' || which === 'all') {
      principles = [...config.principles];
    }
    
    if (which === 'practices' || which === 'all') {
      practices = [...config.practices];
    }
    
    // Format and filter the results
    return formatting.formatPrinciplesAndPractices(principles, practices, filter);
  } catch (error) {
    throw new Error(`Failed to retrieve principles: ${error.message}`);
  }
}

/**
 * Get a specific principle by name
 * @param {string} name - The name of the principle
 * @returns {object|null} - The principle object or null if not found
 */
function getPrincipleByName(name) {
  if (!name) return null;
  
  const nameLower = name.toLowerCase();
  return config.principles.find(p => p.name.toLowerCase() === nameLower) || null;
}

/**
 * Get a specific practice by name
 * @param {string} name - The name of the practice
 * @returns {object|null} - The practice object or null if not found
 */
function getPracticeByName(name) {
  if (!name) return null;
  
  const nameLower = name.toLowerCase();
  return config.practices.find(p => p.name.toLowerCase() === nameLower) || null;
}

/**
 * Check if a principle exists
 * @param {string} name - The name of the principle
 * @returns {boolean} - True if the principle exists
 */
function hasPrinciple(name) {
  return getPrincipleByName(name) !== null;
}

/**
 * Check if a practice exists
 * @param {string} name - The name of the practice
 * @returns {boolean} - True if the practice exists
 */
function hasPractice(name) {
  return getPracticeByName(name) !== null;
}

module.exports = {
  getPrinciples,
  getPrincipleByName,
  getPracticeByName,
  hasPrinciple,
  hasPractice
};
