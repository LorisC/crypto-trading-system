import { describe, expect, it } from 'vitest';
import { PositionId } from '@/domain/value-objects/position-id.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';

describe('PositionId Value Object', () => {
  describe('generation', () => {
    it('should generate valid UUID position id', () => {
      const positionId = PositionId.generate();

      expect(positionId.value).toBeDefined();
      expect(typeof positionId.value).toBe('string');
      expect(positionId.value.length).toBeGreaterThan(0);
    });

    it('should generate unique position ids', () => {
      const id1 = PositionId.generate();
      const id2 = PositionId.generate();

      expect(id1.value).not.toBe(id2.value);
    });

    it('should generate valid UUID v4 format', () => {
      const positionId = PositionId.generate();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(positionId.value).toMatch(uuidRegex);
    });
  });

  describe('creation', () => {
    it('should create from valid string', () => {
      const id = PositionId.from('position-123');

      expect(id.value).toBe('position-123');
    });

    it('should create from UUID string', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = PositionId.from(uuid);

      expect(id.value).toBe(uuid);
    });

    it('should create from alphanumeric string', () => {
      const id = PositionId.from('POS123XYZ789');

      expect(id.value).toBe('POS123XYZ789');
    });

    it('should throw on empty string', () => {
      expect(() => PositionId.from('')).toThrow(InvalidValueObjectException);
    });

    it('should throw on whitespace only', () => {
      expect(() => PositionId.from('   ')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on null', () => {
      expect(() => PositionId.from(null as any)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on undefined', () => {
      expect(() => PositionId.from(undefined as any)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('comparison', () => {
    it('should equal same id', () => {
      const id1 = PositionId.from('position-123');
      const id2 = PositionId.from('position-123');

      expect(id1.equals(id2)).toBe(true);
    });

    it('should not equal different id', () => {
      const id1 = PositionId.from('position-123');
      const id2 = PositionId.from('position-456');

      expect(id1.equals(id2)).toBe(false);
    });

    it('should be case sensitive', () => {
      const id1 = PositionId.from('POSITION-123');
      const id2 = PositionId.from('position-123');

      expect(id1.equals(id2)).toBe(false);
    });

    it('should not equal generated ids', () => {
      const id1 = PositionId.generate();
      const id2 = PositionId.generate();

      expect(id1.equals(id2)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const id = PositionId.from('position-123');

      expect(id.toString()).toBe('position-123');
    });

    it('should serialize to JSON', () => {
      const id = PositionId.from('position-123');
      const json = id.toJSON();

      expect(json).toBe('position-123');
    });

    it('should serialize generated UUID to JSON', () => {
      const id = PositionId.generate();
      const json = id.toJSON();

      expect(typeof json).toBe('string');
      expect(json).toBe(id.value);
    });
  });

  describe('immutability', () => {
    it('should be immutable', () => {
      const id = PositionId.from('position-123');

      expect(() => {
        (id as any).value = 'modified';
      }).toThrow();
    });
  });
});
