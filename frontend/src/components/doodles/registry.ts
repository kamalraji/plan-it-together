import { CharacterDefinition, CharacterStyle, CharacterProps, CharacterComponent } from './types';

// Import all original characters
import { WavingPerson } from './original/WavingPerson';
import { HappyStar } from './original/HappyStar';
import { FloatingCloud } from './original/FloatingCloud';
import { BouncingBall } from './original/BouncingBall';
import { LightbulbIdea } from './original/LightbulbIdea';
import { HeartDoodle } from './original/HeartDoodle';
import { PencilWriting } from './original/PencilWriting';
import { Confetti } from './original/Confetti';
import { RocketDoodle } from './original/RocketDoodle';
import { CalendarDoodle } from './original/CalendarDoodle';
import { TrophyDoodle } from './original/TrophyDoodle';
import { PeopleGroup } from './original/PeopleGroup';
import { CertificateBadge } from './original/CertificateBadge';

// Import all ligne-claire characters
import { WavingPersonLC } from './ligne-claire/WavingPerson';
import { HappyStarLC } from './ligne-claire/HappyStar';
import { FloatingCloudLC } from './ligne-claire/FloatingCloud';
import { BouncingBallLC } from './ligne-claire/BouncingBall';
import { LightbulbIdeaLC } from './ligne-claire/LightbulbIdea';
import { HeartDoodleLC } from './ligne-claire/HeartDoodle';
import { PencilWritingLC } from './ligne-claire/PencilWriting';
import { ConfettiLC } from './ligne-claire/Confetti';
import { RocketDoodleLC } from './ligne-claire/RocketDoodle';
import { CalendarDoodleLC } from './ligne-claire/CalendarDoodle';
import { TrophyDoodleLC } from './ligne-claire/TrophyDoodle';
import { PeopleGroupLC } from './ligne-claire/PeopleGroup';
import { CertificateBadgeLC } from './ligne-claire/CertificateBadge';

// Placeholder components for hand-drawn styles (to be implemented later)
const PlaceholderComponent = (_props: CharacterProps) => {
  return null; // Will be replaced with actual implementations later
};

// Character definitions
const characterDefinitions: CharacterDefinition[] = [
  {
    id: 'waving-person',
    name: 'Waving Person',
    category: 'person',
    variants: {
      original: WavingPerson,
      ligneClaire: WavingPersonLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'wave',
      color: 'sunny',
    },
    animations: ['wave', 'float', 'bounce'],
    description: 'A friendly person waving hello with animated arm movement',
  },
  {
    id: 'happy-star',
    name: 'Happy Star',
    category: 'symbol',
    variants: {
      original: HappyStar,
      ligneClaire: HappyStarLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'float',
      color: 'sunny',
    },
    animations: ['float', 'bounce', 'wiggle'],
    description: 'A cheerful star with a smiling face, perfect for celebrations',
  },
  {
    id: 'floating-cloud',
    name: 'Floating Cloud',
    category: 'nature',
    variants: {
      original: FloatingCloud,
      ligneClaire: FloatingCloudLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'float',
      color: 'primary',
    },
    animations: ['float', 'slide-up'],
    description: 'A gentle cloud with a peaceful expression, floating softly',
  },
  {
    id: 'bouncing-ball',
    name: 'Bouncing Ball',
    category: 'object',
    variants: {
      original: BouncingBall,
      ligneClaire: BouncingBallLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'bounce',
      color: 'primary',
    },
    animations: ['bounce', 'wiggle'],
    description: 'A playful ball with a shiny surface and happy expression',
  },
  {
    id: 'lightbulb-idea',
    name: 'Lightbulb Idea',
    category: 'symbol',
    variants: {
      original: LightbulbIdea,
      ligneClaire: LightbulbIdeaLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'sunny',
    },
    animations: ['pop-in', 'wiggle'],
    description: 'A bright lightbulb representing ideas and inspiration',
  },
  {
    id: 'heart-doodle',
    name: 'Heart Doodle',
    category: 'symbol',
    variants: {
      original: HeartDoodle,
      ligneClaire: HeartDoodleLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'coral',
    },
    animations: ['bounce', 'float'],
    description: 'A loving heart with a gentle shine, expressing care and affection',
  },
  {
    id: 'pencil-writing',
    name: 'Pencil Writing',
    category: 'object',
    variants: {
      original: PencilWriting,
      ligneClaire: PencilWritingLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'sunny',
    },
    animations: ['wiggle'],
    description: 'A pencil in action, creating written content with flowing lines',
  },
  {
    id: 'confetti',
    name: 'Confetti',
    category: 'celebration',
    variants: {
      original: Confetti,
      ligneClaire: ConfettiLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'coral',
    },
    animations: ['float', 'wiggle'],
    description: 'Colorful confetti pieces for celebrations and achievements',
  },
  {
    id: 'rocket-doodle',
    name: 'Rocket Doodle',
    category: 'object',
    variants: {
      original: RocketDoodle,
      ligneClaire: RocketDoodleLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'primary',
    },
    animations: ['slide-up', 'float'],
    description: 'A space rocket ready for launch, representing progress and ambition',
  },
  {
    id: 'calendar-doodle',
    name: 'Calendar Doodle',
    category: 'object',
    variants: {
      original: CalendarDoodle,
      ligneClaire: CalendarDoodleLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'coral',
    },
    animations: ['pop-in'],
    description: 'A calendar showing important dates and events',
  },
  {
    id: 'trophy-doodle',
    name: 'Trophy Doodle',
    category: 'symbol',
    variants: {
      original: TrophyDoodle,
      ligneClaire: TrophyDoodleLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'sunny',
    },
    animations: ['bounce', 'float'],
    description: 'A golden trophy representing achievement and success',
  },
  {
    id: 'people-group',
    name: 'People Group',
    category: 'person',
    variants: {
      original: PeopleGroup,
      ligneClaire: PeopleGroupLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'coral',
    },
    animations: ['float'],
    description: 'A group of three people representing teamwork and community',
  },
  {
    id: 'certificate-badge',
    name: 'Certificate Badge',
    category: 'symbol',
    variants: {
      original: CertificateBadge,
      ligneClaire: CertificateBadgeLC,
      handDrawn: PlaceholderComponent,
    },
    defaultProps: {
      size: 'md',
      animation: 'none',
      color: 'sunny',
    },
    animations: ['pop-in', 'bounce'],
    description: 'A certificate badge with ribbons, representing accomplishments',
  },
];

// Character Registry Class
export class CharacterRegistry {
  private static characters: Record<string, CharacterDefinition> = {};

  static {
    // Auto-register all character definitions
    characterDefinitions.forEach(definition => {
      this.register(definition);
    });
  }

  static register(definition: CharacterDefinition): void {
    this.characters[definition.id] = definition;
  }

  static getCharacter(id: string, style: CharacterStyle = 'original'): CharacterComponent | null {
    const character = this.characters[id];
    if (!character) return null;

    switch (style) {
      case 'ligne-claire':
        return character.variants.ligneClaire;
      case 'hand-drawn':
        return character.variants.handDrawn;
      default:
        return character.variants.original;
    }
  }

  static getCharacterDefinition(id: string): CharacterDefinition | null {
    return this.characters[id] || null;
  }

  static listByCategory(category: string): CharacterDefinition[] {
    return Object.values(this.characters).filter(char => char.category === category);
  }

  static search(query: string): CharacterDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(this.characters).filter(char => 
      char.name.toLowerCase().includes(lowercaseQuery) ||
      char.description.toLowerCase().includes(lowercaseQuery) ||
      char.id.toLowerCase().includes(lowercaseQuery)
    );
  }

  static getAllCharacters(): CharacterDefinition[] {
    return Object.values(this.characters);
  }

  static getCharacterIds(): string[] {
    return Object.keys(this.characters);
  }

  static hasCharacter(id: string): boolean {
    return id in this.characters;
  }
}

// Export individual character definitions for direct access
export { characterDefinitions };

// Export convenience functions
export const getCharacter = (id: string, style?: CharacterStyle) => 
  CharacterRegistry.getCharacter(id, style);

export const getAllCharacters = () => CharacterRegistry.getAllCharacters();

export const getCharactersByCategory = (category: string) => 
  CharacterRegistry.listByCategory(category);

export const searchCharacters = (query: string) => 
  CharacterRegistry.search(query);