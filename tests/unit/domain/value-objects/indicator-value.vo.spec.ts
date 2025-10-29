import { describe, expect, it } from 'vitest';
import { IndicatorValue } from '@/domain/value-objects/indicator-value.vo';
import { Timestamp } from '@/domain/value-objects/timestamp.vo';
import { InvalidValueObjectException } from '@/domain/exceptions';

describe('IndicatorValue Value Object', () => {
  const timestamp = Timestamp.now();

  describe('single value creation', () => {
    it('should create single value indicator', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);

      expect(indicator.getName()).toBe('RSI');
      expect(indicator.getValue()).toBe(65.5);
      expect(indicator.getTimestamp()).toBe(timestamp);
      expect(indicator.isSingleValue()).toBe(true);
      expect(indicator.isMultiValue()).toBe(false);
    });

    it('should create with zero value', () => {
      const indicator = IndicatorValue.single('RSI', 0, timestamp);

      expect(indicator.getValue()).toBe(0);
    });

    it('should create with negative value', () => {
      const indicator = IndicatorValue.single('MACD', -10.5, timestamp);

      expect(indicator.getValue()).toBe(-10.5);
    });

    it('should throw on infinite value', () => {
      expect(() => IndicatorValue.single('RSI', Infinity, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on NaN value', () => {
      expect(() => IndicatorValue.single('RSI', NaN, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('multi value creation', () => {
    it('should create multi value indicator', () => {
      const indicator = IndicatorValue.multi(
        'MACD',
        { macd: 12.5, signal: 10.2, histogram: 2.3 },
        timestamp,
      );

      expect(indicator.getName()).toBe('MACD');
      expect(indicator.getValues()).toEqual({
        macd: 12.5,
        signal: 10.2,
        histogram: 2.3,
      });
      expect(indicator.isSingleValue()).toBe(false);
      expect(indicator.isMultiValue()).toBe(true);
    });

    it('should throw on empty values', () => {
      expect(() => IndicatorValue.multi('MACD', {}, timestamp)).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw on infinite value in multi', () => {
      expect(() =>
        IndicatorValue.multi('MACD', { macd: Infinity, signal: 10 }, timestamp),
      ).toThrow(InvalidValueObjectException);
    });

    it('should throw on NaN value in multi', () => {
      expect(() =>
        IndicatorValue.multi('MACD', { macd: 10, signal: NaN }, timestamp),
      ).toThrow(InvalidValueObjectException);
    });
  });

  describe('RSI factory', () => {
    it('should create RSI indicator', () => {
      const rsi = IndicatorValue.rsi(65.5, timestamp);

      expect(rsi.getName()).toBe('RSI');
      expect(rsi.getValue()).toBe(65.5);
      expect(rsi.isSingleValue()).toBe(true);
    });

    it('should handle RSI edge values', () => {
      const rsi0 = IndicatorValue.rsi(0, timestamp);
      const rsi100 = IndicatorValue.rsi(100, timestamp);

      expect(rsi0.getValue()).toBe(0);
      expect(rsi100.getValue()).toBe(100);
    });
  });

  describe('SMA factory', () => {
    it('should create SMA indicator', () => {
      const sma = IndicatorValue.sma(20, 50000, timestamp);

      expect(sma.getName()).toBe('SMA_20');
      expect(sma.getValue()).toBe(50000);
      expect(sma.isSingleValue()).toBe(true);
    });

    it('should create SMA with different periods', () => {
      const sma50 = IndicatorValue.sma(50, 50000, timestamp);
      const sma200 = IndicatorValue.sma(200, 50000, timestamp);

      expect(sma50.getName()).toBe('SMA_50');
      expect(sma200.getName()).toBe('SMA_200');
    });
  });

  describe('EMA factory', () => {
    it('should create EMA indicator', () => {
      const ema = IndicatorValue.ema(12, 50000, timestamp);

      expect(ema.getName()).toBe('EMA_12');
      expect(ema.getValue()).toBe(50000);
      expect(ema.isSingleValue()).toBe(true);
    });

    it('should create EMA with different periods', () => {
      const ema26 = IndicatorValue.ema(26, 50000, timestamp);

      expect(ema26.getName()).toBe('EMA_26');
    });
  });

  describe('MACD factory', () => {
    it('should create MACD indicator', () => {
      const macd = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);

      expect(macd.getName()).toBe('MACD');
      expect(macd.getValueByKey('macd')).toBe(12.5);
      expect(macd.getValueByKey('signal')).toBe(10.2);
      expect(macd.getValueByKey('histogram')).toBe(2.3);
      expect(macd.isMultiValue()).toBe(true);
    });

    it('should create MACD with negative values', () => {
      const macd = IndicatorValue.macd(-5.5, -3.2, -2.3, timestamp);

      expect(macd.getValueByKey('macd')).toBe(-5.5);
      expect(macd.getValueByKey('signal')).toBe(-3.2);
      expect(macd.getValueByKey('histogram')).toBe(-2.3);
    });
  });

  describe('Bollinger Bands factory', () => {
    it('should create Bollinger Bands indicator', () => {
      const bb = IndicatorValue.bollingerBands(52000, 50000, 48000, timestamp);

      expect(bb.getName()).toBe('BB');
      expect(bb.getValueByKey('upper')).toBe(52000);
      expect(bb.getValueByKey('middle')).toBe(50000);
      expect(bb.getValueByKey('lower')).toBe(48000);
      expect(bb.isMultiValue()).toBe(true);
    });
  });

  describe('Stochastic factory', () => {
    it('should create Stochastic indicator', () => {
      const stoch = IndicatorValue.stochastic(80, 75, timestamp);

      expect(stoch.getName()).toBe('STOCH');
      expect(stoch.getValueByKey('k')).toBe(80);
      expect(stoch.getValueByKey('d')).toBe(75);
      expect(stoch.isMultiValue()).toBe(true);
    });
  });

  describe('getters', () => {
    it('should get value from single value indicator', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);

      expect(indicator.getValue()).toBe(65.5);
    });

    it('should throw when getting single value from multi value indicator', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);

      expect(() => indicator.getValue()).toThrow(InvalidValueObjectException);
    });

    it('should get values from multi value indicator', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);
      const values = indicator.getValues();

      expect(values).toEqual({
        macd: 12.5,
        signal: 10.2,
        histogram: 2.3,
      });
    });

    it('should return copy of values to prevent mutation', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);
      const values1 = indicator.getValues();
      const values2 = indicator.getValues();

      expect(values1).not.toBe(values2);
      expect(values1).toEqual(values2);
    });

    it('should throw when getting multi values from single value indicator', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);

      expect(() => indicator.getValues()).toThrow(InvalidValueObjectException);
    });

    it('should get value by key from multi value indicator', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);

      expect(indicator.getValueByKey('macd')).toBe(12.5);
      expect(indicator.getValueByKey('signal')).toBe(10.2);
      expect(indicator.getValueByKey('histogram')).toBe(2.3);
    });

    it('should throw when getting value by key from single value indicator', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);

      expect(() => indicator.getValueByKey('value')).toThrow(
        InvalidValueObjectException,
      );
    });

    it('should throw when key does not exist in multi value indicator', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);

      expect(() => indicator.getValueByKey('nonexistent')).toThrow(
        InvalidValueObjectException,
      );
    });
  });

  describe('type checking', () => {
    it('should identify single value indicator', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);

      expect(indicator.isSingleValue()).toBe(true);
      expect(indicator.isMultiValue()).toBe(false);
    });

    it('should identify multi value indicator', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);

      expect(indicator.isSingleValue()).toBe(false);
      expect(indicator.isMultiValue()).toBe(true);
    });
  });

  describe('formatting', () => {
    it('should convert single value to string', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);

      expect(indicator.toString()).toBe('RSI: 65.5');
    });

    it('should convert multi value to string', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);
      const str = indicator.toString();

      expect(str).toContain('MACD');
      expect(str).toContain('macd=12.50');
      expect(str).toContain('signal=10.20');
      expect(str).toContain('histogram=2.30');
    });
  });

  describe('serialization', () => {
    it('should serialize single value to JSON', () => {
      const indicator = IndicatorValue.single('RSI', 65.5, timestamp);
      const json = indicator.toJSON();

      expect(json.name).toBe('RSI');
      expect(json).toHaveProperty('value');
      expect(json.value).toBe(65.5);
      expect(json.timestamp).toBeDefined();
      expect(json).not.toHaveProperty('values');
    });

    it('should serialize multi value to JSON', () => {
      const indicator = IndicatorValue.macd(12.5, 10.2, 2.3, timestamp);
      const json = indicator.toJSON();

      expect(json.name).toBe('MACD');
      expect(json).toHaveProperty('values');
      expect(json.values).toEqual({
        macd: 12.5,
        signal: 10.2,
        histogram: 2.3,
      });
      expect(json.timestamp).toBeDefined();
      expect(json).not.toHaveProperty('value');
    });
  });
});
