// ProductList component - placeholder for complex product management
interface ProductListProps {
  products: any[];
  parts: any[];
  sellerId: string | null;
}

export const ProductList = ({ products, parts, sellerId }: ProductListProps) => {
  return (
    <div className="text-center text-muted-foreground py-8">
      Product list component with {products.length} products and {parts.length} parts
      {sellerId ? ` for seller ${sellerId}` : ' (no seller)'}
      - Complex implementation to be ported from original Account.tsx
    </div>
  );
};