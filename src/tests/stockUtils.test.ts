import { getStockStatus, getStockRowClasses, STOCK_THRESHOLD } from '@/lib/stockUtils';

describe('stockUtils', () => {
  describe('getStockStatus', () => {
    test('returns out-of-stock status when stock is 0', () => {
      const status = getStockStatus(0);
      expect(status.level).toBe('out-of-stock');
      expect(status.label).toBe('Out of Stock');
      expect(status.color).toBe('text-red-700');
      expect(status.bgColor).toBe('bg-red-50 dark:bg-red-950/20');
    });

    test('returns low-stock status when stock is below threshold', () => {
      const status = getStockStatus(5);
      expect(status.level).toBe('low-stock');
      expect(status.label).toBe('Low Stock');
      expect(status.color).toBe('text-yellow-700');
      expect(status.bgColor).toBe('bg-yellow-50 dark:bg-yellow-950/20');
    });

    test('returns in-stock status when stock is above threshold', () => {
      const status = getStockStatus(15);
      expect(status.level).toBe('in-stock');
      expect(status.label).toBe('In Stock');
      expect(status.color).toBe('text-green-700');
      expect(status.bgColor).toBe('');
    });

    test('uses custom threshold when provided', () => {
      const status = getStockStatus(5, 3);
      expect(status.level).toBe('in-stock');
      
      const statusWithHighThreshold = getStockStatus(5, 8);
      expect(statusWithHighThreshold.level).toBe('low-stock');
    });

    test('uses default threshold when not provided', () => {
      const status = getStockStatus(STOCK_THRESHOLD - 1);
      expect(status.level).toBe('low-stock');
      
      const statusAtThreshold = getStockStatus(STOCK_THRESHOLD);
      expect(statusAtThreshold.level).toBe('in-stock');
    });
  });

  describe('getStockRowClasses', () => {
    test('returns red background for out-of-stock', () => {
      const classes = getStockRowClasses(0);
      expect(classes).toBe('bg-red-50 dark:bg-red-950/20');
    });

    test('returns yellow background for low stock', () => {
      const classes = getStockRowClasses(5);
      expect(classes).toBe('bg-yellow-50 dark:bg-yellow-950/20');
    });

    test('returns empty string for in-stock', () => {
      const classes = getStockRowClasses(15);
      expect(classes).toBe('');
    });
  });
});