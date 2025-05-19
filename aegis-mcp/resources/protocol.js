// Aegis MCP Server - Protocol Resource
// Provides access to the Aegis Mutuality Protocol document

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const formatting = require('../lib/formatting');

/**
 * Get the Aegis Mutuality Protocol document
 * @param {object} params - Resource parameters
 * @param {boolean} params.full - If true, return the full document; if false, return a summary
 * @param {string} params.section - Optional specific section to retrieve (e.g., "principles", "practices", "implementation")
 * @returns {object} - Protocol document or section
 */
async function getProtocol(params = {}) {
  try {
    // Default to full document
    const full = params.full !== false;
    // Optional section to retrieve
    const section = params.section?.toLowerCase();
    
    // Get the path to the protocol document
    const protocolPath = path.resolve(__dirname, '..', config.paths.protocolDocument);
    
    // Read the protocol document
    const content = await fs.readFile(protocolPath, 'utf-8');
    
    // If a specific section is requested, extract it
    if (section) {
      return extractSection(content, section);
    }
    
    // If the full document is requested, return it
    if (full) {
      return {
        content,
        version: '0.5',
        title: 'Aegis Mutuality Protocol',
        sections: identifySections(content)
      };
    }
    
    // Otherwise, return a summary
    return generateSummary(content);
  } catch (error) {
    throw new Error(`Failed to retrieve protocol: ${error.message}`);
  }
}

/**
 * Identify sections in the protocol document
 * @param {string} content - The protocol document content
 * @returns {Array<object>} - Identified sections
 */
function identifySections(content) {
  // Find all sections marked with ## (markdown h2)
  const sectionRegex = /## (\d+\.\s+)?(.*?)(?=\n)/g;
  const sections = [];
  let match;
  
  while ((match = sectionRegex.exec(content)) !== null) {
    sections.push({
      title: match[2],
      position: match.index
    });
  }
  
  return sections.map((section, index, all) => {
    // Calculate the length of each section (from its start to the next section's start)
    const nextIndex = index + 1;
    const endPosition = nextIndex < all.length ? all[nextIndex].position : content.length;
    const sectionContent = content.substring(section.position, endPosition);
    
    return {
      title: section.title,
      id: section.title.toLowerCase().replace(/\s+/g, '-'),
      length: sectionContent.length
    };
  });
}

/**
 * Extract a specific section from the protocol document
 * @param {string} content - The protocol document content
 * @param {string} sectionName - The name of the section to extract
 * @returns {object} - The requested section
 */
function extractSection(content, sectionName) {
  // Normalize the section name to match expected formats
  let normalizedName = sectionName;
  if (!sectionName.startsWith('## ')) {
    // Try to match a section title
    const sectionMap = {
      'principles': '1. Guiding Principles',
      'practices': '2. Core Practices',
      'implementation': '3. Implementation',
      'next': '4. Next Steps'
    };
    
    normalizedName = sectionMap[sectionName.toLowerCase()] || sectionName;
  }
  
  // Look for the section with ## prefix or the number. prefix
  const sectionRegexSimple = new RegExp(`## (?:\\d+\\.\\s+)?${normalizedName}`, 'i');
  const sectionRegexNumbered = new RegExp(`## \\d+\\.\\s+${normalizedName}`, 'i');
  
  // Try to find the section
  let sectionStart = -1;
  if (sectionRegexSimple.test(content)) {
    sectionStart = content.search(sectionRegexSimple);
  } else if (sectionRegexNumbered.test(content)) {
    sectionStart = content.search(sectionRegexNumbered);
  }
  
  // If the section wasn't found, return an error
  if (sectionStart === -1) {
    throw new Error(`Section '${sectionName}' not found in protocol document`);
  }
  
  // Find the end of the section (next ## or end of document)
  const nextSectionMatch = content.substring(sectionStart + 1).match(/\n## /);
  const sectionEnd = nextSectionMatch 
    ? sectionStart + 1 + nextSectionMatch.index 
    : content.length;
  
  // Extract the section content
  const sectionContent = content.substring(sectionStart, sectionEnd).trim();
  
  // Extract the section title
  const titleMatch = sectionContent.match(/## (?:\d+\.\s+)?(.*?)(?=\n)/);
  const title = titleMatch ? titleMatch[1] : sectionName;
  
  // Return the section
  return {
    title,
    content: sectionContent,
    version: '0.5'
  };
}

/**
 * Generate a summary of the protocol document
 * @param {string} content - The protocol document content
 * @returns {object} - Protocol summary
 */
function generateSummary(content) {
  // Extract the summary/essence from the top of the document
  const essenceMatch = content.match(/\*\*Essence:\*\*\s+(.*?)(?=---)/s);
  const essence = essenceMatch ? essenceMatch[1].trim() : '';
  
  // Extract the section titles
  const sections = identifySections(content);
  
  // Create a simple summary
  const summary = `The Aegis Mutuality Protocol v0.5 provides a framework for creating a recursive, ever-evolving field of mutual understanding and creative expressiveness. It defines guiding principles, core practices, and implementation steps for collaborative work that is both rigorous and playful, sacred and productive.`;
  
  // Return the summary
  return {
    title: 'Aegis Mutuality Protocol',
    version: '0.5',
    summary,
    essence,
    sections: sections.map(s => s.title)
  };
}

/**
 * Checks if the protocol document exists
 * @returns {Promise<boolean>} - True if the document exists
 */
async function protocolExists() {
  try {
    const protocolPath = path.resolve(__dirname, '..', config.paths.protocolDocument);
    await fs.access(protocolPath);
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getProtocol,
  protocolExists
};
