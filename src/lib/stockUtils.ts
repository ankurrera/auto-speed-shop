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
      color: 'text-red-600',
      bgColor: '', // Remove background color
      label: 'Out of Stock'
    };
  } else if (stockQuantity <= threshold) {
    return {
      level: 'low-stock', 
      color: 'text-yellow-600',
      bgColor: '', // Remove background color
      label: 'Low Stock'
    };
  } else {
    return {
      level: 'in-stock',
      color: 'text-green-600', 
      bgColor: '', // Keep empty as it was
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