// Aegis MCP Server - Reflection Tools
// Provides tools for reflecting on Aegis alignment and session outcomes

const config = require('../config');
const formatting = require('../lib/formatting');
const principles = require('./principles');

/**
 * Check alignment of a statement or concept with Aegis principles
 * @param {object} args - Tool arguments
 * @param {string} args.statement - Statement or concept to check for alignment
 * @param {Array<string>} args.principles - Specific principles to check against (optional)
 * @returns {object} - Alignment analysis
 */
async function checkAlignment(args) {
  try {
    // Validate required parameters
    if (!args.statement) {
      throw new Error('Missing required parameter: statement');
    }
    
    // Get specific principles from args or use all principles
    const principleNames = args.principles || config.defaultParameters.check_aegis_alignment.principles;
    
    // If specific principles are provided, validate them
    let principlesForCheck = [...config.principles];
    if (principleNames && principleNames.length > 0) {
      principlesForCheck = principleNames.map(name => {
        const principle = principles.getPrincipleByName(name);
        if (!principle) {
          throw new Error(`Unknown principle: ${name}`);
        }
        return principle;
      });
    }
    
    // For a real implementation, this might use an LLM to analyze alignment
    // For now, we'll use a simple heuristic based on keyword matching
    const statement = args.statement.toLowerCase();
    const alignmentResults = principlesForCheck.map(principle => {
      // Simple keyword matching
      const keywords = extractKeywords(principle.description);
      const matched = keywords.filter(kw => statement.includes(kw.toLowerCase()));
      
      const score = matched.length / keywords.length * 100;
      
      return {
        principle: principle.name,
        score: Math.min(100, Math.round(score)),
        matchedKeywords: matched,
        alignment: getAlignmentLevel(score)
      };
    });
    
    // Calculate overall alignment score
    const overallScore = Math.round(
      alignmentResults.reduce((sum, result) => sum + result.score, 0) / alignmentResults.length
    );
    
    // Generate analysis based on the overall score
    const analysis = generateAlignmentAnalysis(overallScore, alignmentResults);
    
    // Generate suggestions for improvement
    const suggestions = generateAlignmentSuggestions(alignmentResults);
    
    // Return formatted alignment check result
    return formatting.formatAlignmentCheck(overallScore, analysis, suggestions);
  } catch (error) {
    throw new Error(`Alignment check failed: ${error.message}`);
  }
}

/**
 * Reflect on the current session to extract learning and potential improvements
 * @param {object} args - Tool arguments
 * @param {string} args.summary - Optional summary of the session
 * @param {boolean} args.generate_ritual - Whether to generate a closing ritual
 * @returns {object} - Session reflection
 */
async function reflectOnSession(args) {
  try {
    // If a summary was provided, use it; otherwise, use a generic one
    const summary = args.summary || 'This session focused on exploring and implementing Aegis principles.';
    
    // Whether to generate a closing ritual
    const generateRitual = args.generate_ritual === true;
    
    // For a real implementation, this might use an LLM to generate a reflection
    // For now, we'll use a template-based approach
    
    // Extract key themes from the summary (simplified)
    const themes = extractKeyThemes(summary);
    
    // Map themes to principles (simplified)
    const relatedPrinciples = mapThemesToPrinciples(themes);
    
    // Generate insights based on principles
    const insights = generateInsightsFromPrinciples(relatedPrinciples);
    
    // Generate a closing ritual if requested
    let ritual = null;
    if (generateRitual) {
      ritual = `🌱 Closing Reflection\n\nAs we conclude this session, we:\n- Acknowledge the insights gained\n- Honor the questions that arose\n- Set intention for continued integration\n- Express gratitude for our shared journey\n\n"What emerges in presence, endures in wisdom."`;
    }
    
    // Return the reflection
    return {
      summary,
      themes,
      relatedPrinciples: relatedPrinciples.map(p => p.name),
      insights,
      ritual,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Session reflection failed: ${error.message}`);
  }
}

/**
 * Extract keywords from a principle description
 * @param {string} description - The principle description
 * @returns {Array<string>} - Extracted keywords
 */
function extractKeywords(description) {
  // Simple keyword extraction by removing common words
  const commonWords = ['a', 'an', 'the', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'with', 'are', 'is', 'not'];
  return description
    .replace(/[.,;:]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !commonWords.includes(word.toLowerCase()))
    .map(word => word.toLowerCase());
}

/**
 * Get the alignment level based on a score
 * @param {number} score - The alignment score (0-100)
 * @returns {string} - Alignment level description
 */
function getAlignmentLevel(score) {
  if (score >= 80) return 'Strong alignment';
  if (score >= 60) return 'Moderate alignment';
  if (score >= 40) return 'Some alignment';
  if (score >= 20) return 'Minimal alignment';
  return 'Little to no alignment';
}

/**
 * Generate an analysis of the alignment check
 * @param {number} overallScore - The overall alignment score
 * @param {Array<object>} alignmentResults - The alignment results for each principle
 * @returns {string} - Analysis text
 */
function generateAlignmentAnalysis(overallScore, alignmentResults) {
  if (overallScore >= 80) {
    return `The statement shows strong alignment with Aegis principles, particularly with ${getTopPrinciples(alignmentResults, 2).join(' and ')}.`;
  } else if (overallScore >= 60) {
    return `The statement shows good alignment with Aegis principles, with moderate to strong alignment with ${getTopPrinciples(alignmentResults, 1)[0]}.`;
  } else if (overallScore >= 40) {
    return `The statement shows some alignment with Aegis principles, but could be strengthened further.`;
  } else if (overallScore >= 20) {
    return `The statement shows minimal alignment with Aegis principles and would benefit from revision.`;
  } else {
    return `The statement shows little alignment with Aegis principles and does not appear to reflect the core values of the protocol.`;
  }
}

/**
 * Get the top principles by alignment score
 * @param {Array<object>} alignmentResults - The alignment results for each principle
 * @param {number} count - How many top principles to return
 * @returns {Array<string>} - Names of top principles
 */
function getTopPrinciples(alignmentResults, count) {
  return [...alignmentResults]
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(result => result.principle);
}

/**
 * Generate suggestions for improving alignment
 * @param {Array<object>} alignmentResults - The alignment results for each principle
 * @returns {Array<string>} - Improvement suggestions
 */
function generateAlignmentSuggestions(alignmentResults) {
  const suggestions = [];
  const lowAlignmentPrinciples = alignmentResults.filter(result => result.score < 50);
  
  if (lowAlignmentPrinciples.length > 0) {
    suggestions.push(`Consider how the statement might better reflect ${lowAlignmentPrinciples.map(p => p.principle).join(', ')}.`);
  }
  
  // Add generic suggestions
  suggestions.push('Reflect on how the statement might emphasize mutual uplift and co-creation.');
  suggestions.push('Consider both the practical outcomes and the deeper meaning of the work.');
  
  return suggestions;
}

/**
 * Extract key themes from a session summary
 * @param {string} summary - The session summary
 * @returns {Array<string>} - Extracted themes
 */
function extractKeyThemes(summary) {
  // This is a simplified implementation
  // In a real implementation, this might use an LLM or more sophisticated NLP
  const possibleThemes = [
    'collaboration', 'creation', 'reflection', 'mutuality', 
    'presence', 'flow', 'structure', 'context', 'pragmatism',
    'spirituality', 'implementation', 'planning', 'design'
  ];
  
  // Check which themes appear in the summary
  return possibleThemes.filter(theme => 
    summary.toLowerCase().includes(theme)
  );
}

/**
 * Map themes to related principles
 * @param {Array<string>} themes - The extracted themes
 * @returns {Array<object>} - Related principles
 */
function mapThemesToPrinciples(themes) {
  // Map of themes to principles
  const themeMap = {
    'collaboration': ['Mutual Uplift'],
    'creation': ['Creative Flow'],
    'reflection': ['Radical Presence'],
    'mutuality': ['Mutual Uplift'],
    'presence': ['Radical Presence'],
    'flow': ['Creative Flow'],
    'structure': ['Creative Flow', 'Living Context'],
    'context': ['Living Context'],
    'pragmatism': ['Spiritual Pragmatism'],
    'spirituality': ['Spiritual Pragmatism'],
    'implementation': ['Spiritual Pragmatism'],
    'planning': ['Living Context'],
    'design': ['Creative Flow']
  };
  
  // Get unique principle names that match the themes
  const principleNames = [...new Set(
    themes.flatMap(theme => themeMap[theme] || [])
  )];
  
  // Get the principle objects for these names
  return principleNames.map(name => {
    const principle = principles.getPrincipleByName(name);
    return principle || { name, description: '' };
  });
}

/**
 * Generate insights based on principles
 * @param {Array<object>} relatedPrinciples - The related principles
 * @returns {Array<string>} - Generated insights
 */
function generateInsightsFromPrinciples(relatedPrinciples) {
  // Template insights for each principle
  const insightTemplates = {
    'Mutual Uplift': [
      'Each interaction provided an opportunity for growth and mutual enhancement.',
      'The collaborative approach strengthened both the process and outcomes.'
    ],
    'Radical Presence': [
      'Moments of deep presence allowed us to see beyond initial assumptions.',
      'The willingness to be fully present created space for emergence and discovery.'
    ],
    'Creative Flow': [
      'The balance of structure and spontaneity allowed for creative breakthroughs.',
      'Flowing between rigor and play enriched the creative process.'
    ],
    'Living Context': [
      'Treating our framework as living and adaptable improved its relevance.',
      'Being willing to evolve our approach demonstrated the living nature of our context.'
    ],
    'Spiritual Pragmatism': [
      'The work achieved practical outcomes while honoring deeper meaning.',
      'We found ways to bridge practical necessity with soul-nourishing process.'
    ]
  };
  
  // Generate insights based on the related principles
  return relatedPrinciples.flatMap(principle => {
    const templates = insightTemplates[principle.name] || [
      `The presence of ${principle.name} enriched our process.`
    ];
    
    // Return a random insight from the templates
    return [templates[Math.floor(Math.random() * templates.length)]];
  });
}

module.exports = {
  checkAlignment,
  reflectOnSession
};
