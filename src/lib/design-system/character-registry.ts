// Character Registry
// Centralized management system for all doodle characters

import type { CharacterDefinition, CharacterStyle, CharacterProps } from './types';

export class CharacterRegistry {
  private static characters: Record<string, CharacterDefinition> = {};

  static register(definition: CharacterDefinition): void {
    this.characters[definition.id] = definition;
  }

  static getCharacter(id: string, style: CharacterStyle = 'original'): React.ComponentType<CharacterProps> | null {
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

  static listByCategory(category: string): CharacterDefinition[] {
    return Object.values(this.characters).filter(char => char.category === category);
  }

  static search(query: string): CharacterDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return Object.values(this.characters).filter(char => 
      char.name.toLowerCase().includes(lowercaseQuery) ||
      char.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  static getAllCharacters(): CharacterDefinition[] {
    return Object.values(this.characters);
  }
}