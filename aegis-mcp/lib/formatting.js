// Aegis MCP Server - Formatting Utilities
// Provides response formatting and standardization for MCP tools and resources

/**
 * Format a response for consistent structure and presentation
 * @param {any} response - The raw response to format
 * @returns {object} - The formatted response
 */
function formatResponse(response) {
  // If the response is already an object, use it as is but ensure consistent structure
  if (typeof response === 'object' && response !== null) {
    return {
      timestamp: new Date().toISOString(),
      ...response
    };
  }
  
  // Convert primitive values to a structured response
  return {
    value: response,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format an insight entry for logging
 * @param {string} insight - The insight content
 * @param {string} category - The insight category
 * @param {Array<string>} tags - Tags for the insight
 * @returns {object} - The formatted insight entry
 */
function formatInsight(insight, category = 'other', tags = []) {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateString = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  });
  
  return {
    content: insight,
    category,
    tags: Array.isArray(tags) ? tags : [],
    timestamp,
    dateString,
    markdownEntry: `\n---\n\n*(${dateString})* - ${insight}\n`
  };
}

/**
 * Format principles and practices data for API responses
 * @param {Array} principles - Array of principle objects
 * @param {Array} practices - Array of practice objects
 * @param {string} filter - Optional filter term
 * @returns {object} - Formatted principles and practices
 */
function formatPrinciplesAndPractices(principles, practices, filter = null) {
  let filteredPrinciples = [...principles];
  let filteredPractices = [...practices];
  
  // Apply filter if provided
  if (filter) {
    const filterTerm = filter.toLowerCase();
    filteredPrinciples = principles.filter(p => 
      p.name.toLowerCase().includes(filterTerm) || 
      p.description.toLowerCase().includes(filterTerm)
    );
    
    filteredPractices = practices.filter(p => 
      p.name.toLowerCase().includes(filterTerm) || 
      p.description.toLowerCase().includes(filterTerm) ||
      (p.mantra && p.mantra.toLowerCase().includes(filterTerm))
    );
  }
  
  return {
    principles: filteredPrinciples,
    practices: filteredPractices,
    count: {
      principles: filteredPrinciples.length,
      practices: filteredPractices.length,
      total: filteredPrinciples.length + filteredPractices.length
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Format an alignment check result
 * @param {number} score - The alignment score (0-100)
 * @param {string} analysis - Textual analysis of the alignment
 * @param {Array<string>} suggestions - Improvement suggestions
 * @returns {object} - Formatted alignment check result
 */
function formatAlignmentCheck(score, analysis, suggestions = []) {
  return {
    score,
    analysis,
    suggestions: Array.isArray(suggestions) ? suggestions : [],
    timestamp: new Date().toISOString()
  };
}

/**
 * Format error responses
 * @param {Error} error - The error object
 * @returns {object} - Formatted error response
 */
function formatError(error) {
  return {
    status: 'error',
    message: error.message || 'Unknown error occurred',
    details: error.details || null,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  formatResponse,
  formatInsight,
  formatPrinciplesAndPractices,
  formatAlignmentCheck,
  formatError
};
