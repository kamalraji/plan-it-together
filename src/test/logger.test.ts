import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, configureLogger } from '@/lib/logger';

describe('Logger utility', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods to verify no output in production mode
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger methods exist', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have track method', () => {
      expect(typeof logger.track).toBe('function');
    });

    it('should have api method', () => {
      expect(typeof logger.api).toBe('function');
    });

    it('should have group method', () => {
      expect(typeof logger.group).toBe('function');
    });

    it('should have time/timeEnd methods', () => {
      expect(typeof logger.time).toBe('function');
      expect(typeof logger.timeEnd).toBe('function');
    });

    it('should have table method', () => {
      expect(typeof logger.table).toBe('function');
    });
  });

  describe('logger does not output to console in production mode', () => {
    beforeEach(() => {
      // Configure logger to production mode (no console output)
      configureLogger({
        enableDebug: false,
        enableInfo: false,
        enableWarn: false,
        enableError: false,
        sendToSentry: false,
      });
    });

    it('debug should not log to console', () => {
      logger.debug('test message', { key: 'value' });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('info should not log to console', () => {
      logger.info('test message', { key: 'value' });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('warn should not log to console', () => {
      logger.warn('test message', { key: 'value' });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('error should not log to console', () => {
      logger.error('test message', new Error('test'), { key: 'value' });
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('api should not log to console', () => {
      logger.api('GET', '/test', 200, 100);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('table should not log to console', () => {
      logger.table([{ a: 1 }, { a: 2 }]);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('group method', () => {
    it('should execute the callback function', () => {
      const mockFn = vi.fn();
      logger.group('test group', mockFn);
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('configureLogger', () => {
    it('should be a function', () => {
      expect(typeof configureLogger).toBe('function');
    });

    it('should accept partial config', () => {
      expect(() => configureLogger({ enableDebug: true })).not.toThrow();
    });
  });
});
