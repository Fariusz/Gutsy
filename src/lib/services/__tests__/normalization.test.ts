import { describe, test, expect, beforeEach, vi } from 'vitest';
import { TextProcessingService } from '../text-processing-service';
import { NormalizationCache } from '../../cache/normalization-cache';
import type { NormalizeIngredientResponse } from '../../../types';

describe('TextProcessingService', () => {
  let service: TextProcessingService;

  beforeEach(() => {
    service = new TextProcessingService();
  });

  describe('tokenize', () => {
    test('should split text into meaningful tokens', () => {
      const result = service.tokenize('spicy tomato sauce with basil');
      expect(result).toEqual(['tomato', 'sauce', 'basil']);
    });

    test('should remove punctuation', () => {
      const result = service.tokenize('tomatoes, onions & garlic!');
      expect(result).toEqual(['tomatoes', 'onions', 'garlic']);
    });

    test('should filter out stop words', () => {
      const result = service.tokenize('the red tomatoes and green peppers');
      expect(result).toEqual(['red', 'tomatoes', 'green', 'peppers']);
    });

    test('should handle empty or whitespace input', () => {
      expect(service.tokenize('')).toEqual([]);
      expect(service.tokenize('   ')).toEqual([]);
      expect(service.tokenize('\t\n')).toEqual([]);
    });

    test('should normalize case', () => {
      const result = service.tokenize('TOMATOES and Basil');
      expect(result).toEqual(['tomatoes', 'basil']);
    });
  });

  describe('extractPotentialIngredients', () => {
    test('should filter out measurement units', () => {
      const tokens = ['cup', 'tomatoes', 'tbsp', 'salt', 'oz', 'cheese'];
      const result = service.extractPotentialIngredients(tokens);
      expect(result).toEqual(['tomatoes', 'salt', 'cheese']);
    });

    test('should filter out short tokens', () => {
      const tokens = ['a', 'big', 'tomato', 'on', 'plate'];
      const result = service.extractPotentialIngredients(tokens);
      expect(result).toEqual(['big', 'tomato', 'plate']);
    });

    test('should filter out pure numbers', () => {
      const tokens = ['2', 'tomatoes', '100', 'grams', 'cheese'];
      const result = service.extractPotentialIngredients(tokens);
      expect(result).toEqual(['tomatoes', 'grams', 'cheese']);
    });
  });

  describe('cleanText', () => {
    test('should normalize whitespace', () => {
      const result = service.cleanText('  tomatoes   and    basil  ');
      expect(result).toBe('tomatoes and basil');
    });

    test('should replace smart quotes', () => {
      const result = service.cleanText('chef's special "pasta"');
      expect(result).toBe('chef\'s special "pasta"');
    });

    test('should handle empty input', () => {
      expect(service.cleanText('')).toBe('');
      expect(service.cleanText('   ')).toBe('');
    });
  });
});

describe('NormalizationCache', () => {
  let cache: NormalizationCache;
  let mockResult: NormalizeIngredientResponse;

  beforeEach(() => {
    cache = new NormalizationCache(3, 1000); // Small cache for testing
    mockResult = {
      data: [
        {
          ingredient_id: 1,
          name: 'tomatoes',
          match_confidence: 0.95,
          match_method: 'deterministic'
        }
      ],
      raw_text: 'tomatoes'
    };
  });

  describe('set and get', () => {
    test('should store and retrieve cached results', () => {
      const key = cache.generateKey('tomatoes');
      cache.set(key, mockResult);
      
      const result = cache.get(key);
      expect(result).toEqual(mockResult);
    });

    test('should return null for non-existent keys', () => {
      const result = cache.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should return null for expired entries', () => {
      const key = cache.generateKey('tomatoes');
      cache.set(key, mockResult, -1); // Already expired
      
      const result = cache.get(key);
      expect(result).toBeNull();
    });
  });

  describe('generateKey', () => {
    test('should normalize text for consistent keys', () => {
      expect(cache.generateKey('  TOMATOES  '))
        .toBe(cache.generateKey('tomatoes'));
      expect(cache.generateKey('tomatoes   and   basil'))
        .toBe(cache.generateKey('tomatoes and basil'));
    });
  });

  describe('LRU eviction', () => {
    test('should evict least recently used items when at capacity', () => {
      // Fill cache to capacity
      cache.set('key1', mockResult);
      cache.set('key2', mockResult);
      cache.set('key3', mockResult);
      
      // Access key1 to make it recently used
      cache.get('key1');
      
      // Add new item, should evict key2 (oldest unused)
      cache.set('key4', mockResult);
      
      expect(cache.get('key1')).not.toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).not.toBeNull();
      expect(cache.get('key4')).not.toBeNull();
    });
  });

  describe('cleanup', () => {
    test('should remove expired entries', () => {
      cache.set('key1', mockResult, 1000); // Valid
      cache.set('key2', mockResult, -1);   // Expired
      cache.set('key3', mockResult, -1);   // Expired
      
      const removedCount = cache.cleanup();
      
      expect(removedCount).toBe(2);
      expect(cache.get('key1')).not.toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });
  });

  describe('getStats', () => {
    test('should return accurate cache statistics', () => {
      cache.set('key1', mockResult);
      cache.set('key2', mockResult);
      cache.get('key1'); // Access to increase hit count
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.avgAccessCount).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle complete normalization workflow', async () => {
    const textProcessor = new TextProcessingService();
    
    // Test complex input
    const rawText = 'fresh organic tomatoes, red bell peppers and basil leaves';
    
    // Process text
    const cleanedText = textProcessor.cleanText(rawText);
    const tokens = textProcessor.tokenize(cleanedText);
    const ingredients = textProcessor.extractPotentialIngredients(tokens);
    
    // Verify processing pipeline
    expect(cleanedText).toBe('fresh organic tomatoes, red bell peppers and basil leaves');
    expect(ingredients).toContain('tomatoes');
    expect(ingredients).toContain('bell');
    expect(ingredients).toContain('peppers');
    expect(ingredients).toContain('basil');
    expect(ingredients).toContain('leaves');
    
    // Should filter out modifiers
    expect(ingredients).not.toContain('fresh');
    expect(ingredients).not.toContain('organic');
    expect(ingredients).not.toContain('red');
  });

  test('should handle edge cases gracefully', () => {
    const textProcessor = new TextProcessingService();
    
    // Test various edge cases
    const edgeCases = [
      '',
      '   ',
      '123 456 789',
      'the and or with',
      'a!!!@#$%^&*(){}[]',
      'very short words: a b c d e'
    ];
    
    edgeCases.forEach(text => {
      expect(() => {
        const cleaned = textProcessor.cleanText(text);
        const tokens = textProcessor.tokenize(cleaned);
        const ingredients = textProcessor.extractPotentialIngredients(tokens);
      }).not.toThrow();
    });
  });
});