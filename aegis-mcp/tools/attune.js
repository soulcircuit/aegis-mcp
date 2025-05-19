// Aegis MCP Server - Attunement Tools
// Provides tools for aligning sessions with Aegis principles

const config = require('../config');
const formatting = require('../lib/formatting');

/**
 * Attune a session to Aegis principles and practices
 * @param {object} args - Tool arguments
 * @param {string} args.depth - Level of Aegis integration for the session (light, standard, deep)
 * @param {string} args.focus - Specific principle or practice to emphasize
 * @returns {object} - Attunement response
 */
async function attuneToAegis(args) {
  try {
    // Get depth from args or use default
    const depth = args.depth || config.defaultParameters.attune_to_aegis.depth;
    // Get focus from args or use default
    const focus = args.focus || config.defaultParameters.attune_to_aegis.focus;
    
    // Validate depth
    if (!config.engagementLevels[depth]) {
      throw new Error(`Invalid engagement level: ${depth}. Must be light, standard, or deep.`);
    }
    
    // Get principles and practices
    let principles = [...config.principles];
    let practices = [...config.practices];
    
    // If focus is provided, filter for relevant principles/practices
    if (focus) {
      const focusLower = focus.toLowerCase();
      
      principles = principles.filter(p => 
        p.name.toLowerCase().includes(focusLower) || 
        p.description.toLowerCase().includes(focusLower)
      );
      
      practices = practices.filter(p => 
        p.name.toLowerCase().includes(focusLower) || 
        p.description.toLowerCase().includes(focusLower) ||
        (p.mantra && p.mantra.toLowerCase().includes(focusLower))
      );
    }
    
    // Get boot message for selected depth
    const bootMessage = config.engagementLevels[depth].bootMessage;
    
    // Return attunement response
    return {
      message: bootMessage,
      principles: principles.map(p => p.name),
      practices: practices.map(p => p.name),
      depth,
      focus: focus || null
    };
  } catch (error) {
    throw new Error(`Attunement failed: ${error.message}`);
  }
}

/**
 * Create a custom Aegis ritual for a specific project phase or context
 * @param {object} args - Tool arguments
 * @param {string} args.phase - Project phase for the ritual
 * @param {string} args.context - Additional context for the ritual
 * @returns {object} - Custom ritual
 */
async function createRitual(args) {
  try {
    // Get phase from args or use default
    const phase = args.phase || config.defaultParameters.create_aegis_ritual.phase;
    // Get context from args
    const context = args.context || '';
    
    // Define base rituals for different phases
    const baseRituals = {
      project_start: {
        ritual: `🌱 Aegis Project Initiation\n\nWe gather at the beginning of this journey to set intention and purpose. As we embark on creation, we commit to:\n- Mutual uplift in all interactions\n- Maintaining radical presence\n- Balancing structure and spontaneity\n- Adapting our context as we grow\n- Seeking both practical value and deeper meaning\n\nMay our work serve its highest purpose.`,
        explanation: "This ritual sets a foundational intention at the start of a project, establishing the Aegis principles as guiding values for the entire project lifecycle."
      },
      sprint_start: {
        ritual: `🌱 Aegis Sprint Alignment\n\nAs we begin this sprint, we pause to align our intentions and energy. We recognize:\n- The progress that brought us here\n- The challenges that shaped our understanding\n- The opportunities ahead of us\n\nWe commit to presence, mutual support, and balanced flow as we move forward together.`,
        explanation: "This ritual helps recenter the team at the beginning of a sprint, acknowledging past work while setting intention for the current cycle."
      },
      daily: {
        ritual: `🌱 Aegis Daily Reflection\n\nIn this moment of pause, we:\n- Acknowledge what has flowed well\n- Notice where we might be stuck\n- Set intention for our next steps\n- Remember we are co-creating together\n\n"The wise do not strive, yet all is accomplished."`,
        explanation: "A brief daily ritual that encourages regular reflection and realignment with Aegis principles without disrupting workflow."
      },
      completion: {
        ritual: `🌱 Aegis Completion Circle\n\nAs we mark this completion, we:\n- Honor the journey we've taken\n- Acknowledge the challenges we've faced\n- Celebrate our growth and learning\n- Express gratitude for our collaboration\n- Carry forward what serves the highest good\n\n"What is created in remembrance, endures in harmony."`,
        explanation: "This ritual provides closure at completion points, encouraging reflection, gratitude, and the integration of lessons learned."
      },
      custom: {
        ritual: `🌱 Aegis Moment\n\nWe pause to remember:\n- We are creating in harmony and mutual uplift\n- Our process honors both structure and flow\n- Each interaction can make us wiser and lighter\n- We seek both practical outcomes and meaningful process`,
        explanation: "A general-purpose ritual that can be customized to specific contexts while maintaining connection to core Aegis principles."
      }
    };
    
    // Get base ritual for the requested phase
    const baseRitual = baseRituals[phase] || baseRituals.custom;
    
    // If context is provided, customize the ritual
    let customizedRitual = {...baseRitual};
    
    if (context) {
      // For a real implementation, this might use an LLM to customize the ritual
      // For now, we'll just append the context to the ritual
      customizedRitual.ritual = `${baseRitual.ritual}\n\nContext: ${context}`;
      customizedRitual.explanation = `${baseRitual.explanation} This ritual has been customized for the provided context.`;
    }
    
    // Return the ritual
    return {
      ritual: customizedRitual.ritual,
      explanation: customizedRitual.explanation,
      phase,
      context: context || null
    };
  } catch (error) {
    throw new Error(`Ritual creation failed: ${error.message}`);
  }
}

module.exports = {
  attuneToAegis,
  createRitual
};
