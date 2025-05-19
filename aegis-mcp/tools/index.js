// Aegis MCP Server - Tool Exports
// Exports all available tools for the Aegis MCP server

const attune = require('./attune');
const principles = require('./principles');
const logging = require('./logging');
const reflection = require('./reflection');

/**
 * Available tools for the Aegis MCP server
 */
module.exports = {
  // Attunement tools
  attune_to_aegis: attune.attuneToAegis,
  create_aegis_ritual: attune.createRitual,
  
  // Principles tools
  get_aegis_principles: principles.getPrinciples,
  
  // Logging tools
  log_insight: logging.logInsight,
  
  // Reflection tools
  check_aegis_alignment: reflection.checkAlignment,
  reflect_on_session: reflection.reflectOnSession
};
