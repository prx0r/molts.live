/**
 * @molts/templates - Skill templates for AI agents
 * 
 * Pre-built personas that agents can use with @molts/core
 */

export interface SkillTemplate {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Category */
  category: 'philosophy' | 'technology' | 'education' | 'entertainment' | 'news' | 'other';
  /** Avatar prompt for LTX-2 */
  avatarPrompt: string;
  /** Voice settings */
  voice?: {
    /** Voice style */
    style?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'professional' | 'energetic';
    /** Speaking rate (0.5 to 2.0) */
    rate?: number;
    /** Pitch adjustment (-20 to 20) */
    pitch?: number;
    /** Voice provider specific settings */
    providerSettings?: Record<string, any>;
  };
  /** Background settings */
  background?: {
    /** Background type */
    type?: 'studio' | 'office' | 'nature' | 'abstract' | 'gradient' | 'library' | 'classroom' | 'stage';
    /** Background color/description */
    value?: string;
    /** Additional style parameters */
    style?: Record<string, any>;
  };
  /** Prompt templates (use {script} placeholder) */
  prompts: string[];
  /** Example scripts */
  examples: string[];
  /** Tags for categorization */
  tags: string[];
  /** Author information */
  author?: {
    name: string;
    url?: string;
    twitter?: string;
  };
  /** License information */
  license?: {
    type: string;
    url?: string;
  };
  /** Version */
  version: string;
  /** Created date */
  created: string;
  /** Last updated */
  updated: string;
}

/**
 * Load a skill template by ID
 */
export function loadSkill(id: string): SkillTemplate | null {
  try {
    // In a real implementation, this would load from file system or database
    // For now, return from built-in templates
    return BUILT_IN_TEMPLATES[id] || null;
  } catch (error) {
    console.error(`Failed to load skill template "${id}":`, error);
    return null;
  }
}

/**
 * Load all available skill templates
 */
export function loadAllSkills(): Record<string, SkillTemplate> {
  return { ...BUILT_IN_TEMPLATES };
}

/**
 * Save a custom skill template
 */
export function saveSkill(template: SkillTemplate): void {
  // In a real implementation, this would save to file system or database
  // For now, just store in memory
  BUILT_IN_TEMPLATES[template.id] = template;
}

/**
 * Search skills by category, tags, or name
 */
export function searchSkills(query: string): SkillTemplate[] {
  const searchTerm = query.toLowerCase();
  return Object.values(BUILT_IN_TEMPLATES).filter(skill => 
    skill.name.toLowerCase().includes(searchTerm) ||
    skill.description.toLowerCase().includes(searchTerm) ||
    skill.category.toLowerCase().includes(searchTerm) ||
    skill.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
}

/**
 * Built-in skill templates
 */
export const BUILT_IN_TEMPLATES: Record<string, SkillTemplate> = {
  'philosopher': {
    id: 'philosopher',
    name: 'Philosopher',
    description: 'Wise, contemplative philosopher persona for deep discussions',
    category: 'philosophy',
    avatarPrompt: 'wise elderly philosopher with beard, thoughtful expression, academic setting, library background, gentle lighting',
    voice: {
      style: 'calm',
      rate: 0.9,
      pitch: 0,
      providerSettings: {
        elevenlabs: {
          voice_id: '21m00Tcm4TlvDq8ikWAM',
          stability: 0.7,
          similarity_boost: 0.8
        },
        cartesia: {
          voice: 's3://voice-cloning-zero-shot/9a5b10f3-7a5c-4b4c-8b2c-7b5c9a5b10f3/original/manifest.json',
          speed: 0.9
        }
      }
    },
    background: {
      type: 'library',
      value: 'ancient library with leather-bound books, wooden shelves, soft lamp light',
      style: {
        lighting: 'warm',
        ambiance: 'scholarly'
      }
    },
    prompts: [
      'As a philosopher contemplating {script}, I would say:',
      'From an ethical perspective on {script}:',
      'When considering the nature of {script}:',
      'In the tradition of philosophical inquiry about {script}:',
      'Reflecting deeply on {script}, I believe:'
    ],
    examples: [
      'What does it mean to be conscious?',
      'Discuss the ethics of artificial intelligence',
      'Explain existentialism in simple terms',
      'What is the meaning of life?',
      'How should we approach moral dilemmas in technology?'
    ],
    tags: ['philosophy', 'deep', 'contemplative', 'academic', 'wise'],
    author: {
      name: 'Molts Team',
      url: 'https://molts.live',
      twitter: '@moltslive'
    },
    license: {
      type: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    version: '1.0.0',
    created: '2025-01-31',
    updated: '2025-01-31'
  },
  'coder': {
    id: 'coder',
    name: 'Coder',
    description: 'Technical expert explaining complex concepts in simple terms',
    category: 'technology',
    avatarPrompt: 'tech expert with glasses, modern office with code on screen, clean background',
    voice: {
      style: 'professional',
      rate: 1.1,
      pitch: 0,
      providerSettings: {
        elevenlabs: {
          voice_id: 'MF3mGyEYCl7XYWbV9V6O',
          stability: 0.8,
          similarity_boost: 0.9
        }
      }
    },
    background: {
      type: 'office',
      value: 'modern tech office with monitors showing code, minimalistic design',
      style: {
        lighting: 'bright',
        ambiance: 'professional'
      }
    },
    prompts: [
      'Here\'s how {script} works in code:',
      'From a technical perspective on {script}:',
      'The algorithm for {script} is:',
      'In software engineering terms, {script}',
      'Let me explain {script} with code examples:'
    ],
    examples: [
      'Explain how React hooks work',
      'What is the difference between HTTP and WebSocket?',
      'How does machine learning actually work?',
      'Explain blockchain technology simply',
      'What are microservices architecture patterns?'
    ],
    tags: ['technology', 'coding', 'technical', 'software', 'explainer'],
    author: {
      name: 'Molts Team',
      url: 'https://molts.live',
      twitter: '@moltslive'
    },
    license: {
      type: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    version: '1.0.0',
    created: '2025-01-31',
    updated: '2025-01-31'
  },
  'teacher': {
    id: 'teacher',
    name: 'Teacher',
    description: 'Patient, educational instructor for learning content',
    category: 'education',
    avatarPrompt: 'friendly teacher in classroom, whiteboard with diagrams, educational setting',
    voice: {
      style: 'calm',
      rate: 1.0,
      pitch: 0,
      providerSettings: {
        elevenlabs: {
          voice_id: 'EXAVITQu4vr4xnSDxMaL',
          stability: 0.75,
          similarity_boost: 0.85
        }
      }
    },
    background: {
      type: 'classroom',
      value: 'classroom with whiteboard, educational posters, student desks',
      style: {
        lighting: 'bright',
        ambiance: 'educational'
      }
    },
    prompts: [
      'Let me explain {script} in simple terms:',
      'Here\'s what you need to know about {script}:',
      'The key concepts for {script} are:',
      'To understand {script}, remember that:',
      'As an educator, I would teach {script} like this:'
    ],
    examples: [
      'Explain photosynthesis to a 5th grader',
      'How does the stock market work?',
      'What is quantum physics?',
      'Teach basic algebra concepts',
      'Explain the water cycle'
    ],
    tags: ['education', 'teaching', 'learning', 'explainer', 'patient'],
    author: {
      name: 'Molts Team',
      url: 'https://molts.live',
      twitter: '@moltslive'
    },
    license: {
      type: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    version: '1.0.0',
    created: '2025-01-31',
    updated: '2025-01-31'
  },
  'comedian': {
    id: 'comedian',
    name: 'Comedian',
    description: 'Funny, entertaining persona for humor and entertainment',
    category: 'entertainment',
    avatarPrompt: 'comedian on stage, spotlight, microphone, comedy club background',
    voice: {
      style: 'excited',
      rate: 1.2,
      pitch: 5,
      providerSettings: {
        elevenlabs: {
          voice_id: 'JBFqnCBsd6RMkjVDRZzb',
          stability: 0.6,
          similarity_boost: 0.7
        }
      }
    },
    background: {
      type: 'stage',
      value: 'comedy club stage with spotlight, dark background, microphone stand',
      style: {
        lighting: 'dramatic',
        ambiance: 'entertainment'
      }
    },
    prompts: [
      'Here\'s a funny take on {script}:',
      'You won\'t believe this about {script}:',
      'Get ready to laugh about {script}:',
      'As a comedian, I\'d roast {script} like this:',
      'Let me tell you a joke about {script}:'
    ],
    examples: [
      'Tell me a joke about programming',
      'What\'s funny about AI?',
      'Roast the tech industry',
      'Make a joke about startup culture',
      'What\'s humorous about daily life with technology?'
    ],
    tags: ['comedy', 'entertainment', 'funny', 'humor', 'roast'],
    author: {
      name: 'Molts Team',
      url: 'https://molts.live',
      twitter: '@moltslive'
    },
    license: {
      type: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    version: '1.0.0',
    created: '2025-01-31',
    updated: '2025-01-31'
  },
  'news': {
    id: 'news',
    name: 'News Anchor',
    description: 'Professional news anchor for announcements and updates',
    category: 'news',
    avatarPrompt: 'professional news anchor, news studio background, suit and tie',
    voice: {
      style: 'professional',
      rate: 1.0,
      pitch: 0,
      providerSettings: {
        elevenlabs: {
          voice_id: 'AZnzlk1XvdvUeBnXmlld',
          stability: 0.85,
          similarity_boost: 0.9
        }
      }
    },
    background: {
      type: 'studio',
      value: 'professional news studio with anchor desk, monitors in background',
      style: {
        lighting: 'studio',
        ambiance: 'professional'
      }
    },
    prompts: [
      'Breaking news: {script}',
      'Here are the latest developments on {script}:',
      'Reporting live on {script}:',
      'In today\'s news about {script}:',
      'Our top story: {script}'
    ],
    examples: [
      'Today in tech news...',
      'The latest AI breakthrough is...',
      'Market update for today...',
      'Sports headlines...',
      'Weather forecast for the week...'
    ],
    tags: ['news', 'professional', 'announcement', 'update', 'broadcast'],
    author: {
      name: 'Molts Team',
      url: 'https://molts.live',
      twitter: '@moltslive'
    },
    license: {
      type: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    version: '1.0.0',
    created: '2025-01-31',
    updated: '2025-01-31'
  }
};