/**
 * Utility functions for stock management and highlighting
 */

export const STOCK_THRESHOLD = 10; // Default threshold for low stock

export interface StockStatus {
  level: 'out-of-stock' | 'low-stock' | 'in-stock';
  color: string;
  bgColor: string;
  label: string;
}

/**
 * Get stock status and styling information
 * @param stockQuantity Current stock quantity
 * @param threshold Low stock threshold (default: 10)
 * @returns Stock status object with styling information
 */
export const getStockStatus = (
  stockQuantity: number, 
  threshold: number = STOCK_THRESHOLD
): StockStatus => {
  if (stockQuantity === 0) {
    return {
      level: 'out-of-stock',
      color: 'text-red-700',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      label: 'Out of Stock'
    };
  } else if (stockQuantity < threshold) {
    return {
      level: 'low-stock', 
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      label: 'Low Stock'
    };
  } else {
    return {
      level: 'in-stock',
      color: 'text-green-700', 
      bgColor: '',
      label: 'In Stock'
    };
  }
};

/**
 * Get CSS classes for table row based on stock level
 * @param stockQuantity Current stock quantity
 * @param threshold Low stock threshold (default: 10)
 * @returns CSS class string for table row
 */
export const getStockRowClasses = (
  stockQuantity: number,
  threshold: number = STOCK_THRESHOLD
): string => {
  const status = getStockStatus(stockQuantity, threshold);
  return status.bgColor;
};