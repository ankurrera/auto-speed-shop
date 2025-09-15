# Image Rearrangement Feature

This document describes the new image rearrangement functionality added to the AutoParts Pro product and parts upload system.

## Overview

The image rearrangement feature allows sellers to reorganize the order of images during product/parts upload. This is important because the first image in the list becomes the main product image displayed in listings.

## Features

### 🎯 Drag & Drop
- **Intuitive Interface**: Click and drag images to reorder them
- **Visual Feedback**: Images show opacity change and ring border during dragging
- **Touch Support**: Works on both desktop and mobile devices

### ⌨️ Button Controls
- **Up/Down Arrows**: Alternative to drag-and-drop for precise control
- **Smart Disabling**: First image can't move up, last image can't move down
- **Accessible**: Works with keyboard navigation and screen readers

### 🎨 Visual Indicators
- **Index Badges**: Blue numbered badges (1, 2, 3...) show image order
- **Drag Handle**: Grip icon appears on hover for clear drag interaction
- **Hover Effects**: Controls appear on image hover for clean interface

### 💾 Order Preservation
- **Persistent Order**: Image order is maintained through the upload process
- **Synchronization**: Properly syncs between existing database images and new file uploads

## Implementation Details

### Components

#### `DraggableImageList.tsx`
New React component that provides the drag-and-drop functionality:

```typescript
interface DraggableImageListProps {
  images: string[];              // Array of image URLs
  onReorder: (newOrder: string[]) => void;  // Called when order changes
  onRemove: (index: number) => void;        // Called when image is removed
}
```

### Dependencies

The feature uses modern, well-maintained libraries:
- `@dnd-kit/core` - Core drag-and-drop functionality
- `@dnd-kit/sortable` - Sortable list implementation
- `@dnd-kit/utilities` - CSS utilities for transform handling

### Integration Points

#### Account.tsx Updates
1. **Import**: Added `DraggableImageList` component import
2. **Handler**: New `handleImageReorder` function manages order changes
3. **State Sync**: Updates both existing images and new file arrays
4. **UI Replacement**: Replaced static image grid with draggable component

## Usage

### For Sellers

1. **Upload Images**: Use the file input to select multiple images
2. **Reorder Images**: 
   - **Drag Method**: Click and drag images to new positions
   - **Button Method**: Use ↑/↓ arrows to move images up/down
3. **Visual Confirmation**: Blue badges show the final order (1, 2, 3...)
4. **Submit**: Image order is preserved when the listing is saved

### For Developers

#### Adding to New Upload Forms

```tsx
import { DraggableImageList } from '@/components/DraggableImageList';

// In your component:
const [images, setImages] = useState<string[]>([]);

const handleReorder = (newOrder: string[]) => {
  setImages(newOrder);
  // Additional logic to sync with your state management
};

const handleRemove = (index: number) => {
  const newImages = images.filter((_, i) => i !== index);
  setImages(newImages);
};

// In your JSX:
<DraggableImageList
  images={images}
  onReorder={handleReorder}
  onRemove={handleRemove}
/>
```

## Technical Considerations

### Performance
- **Efficient Rendering**: Only re-renders changed components
- **Memory Management**: Properly revokes object URLs to prevent memory leaks
- **Bundle Size**: Modern libraries with tree-shaking support

### Accessibility
- **Keyboard Support**: Full keyboard navigation with arrow keys
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Focus Management**: Clear focus indicators and logical tab order

### Browser Support
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Touch Events**: Full touch support for mobile devices

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Operations**: Select multiple images and move them together
2. **Grid View**: Switch between list and grid layouts
3. **Image Preview**: Larger preview on hover or click
4. **Undo/Redo**: History stack for image reordering operations
5. **Keyboard Shortcuts**: Hotkeys for common operations

## Testing

The component includes comprehensive tests covering:
- Rendering with different image counts
- Button state management (enabled/disabled)
- Event handling for reorder and remove operations
- Edge cases (empty lists, single images)

## Browser Compatibility

Tested and verified on:
- ✅ Chrome 120+
- ✅ Firefox 121+
- ✅ Safari 17+
- ✅ Edge 120+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Conclusion

The image rearrangement feature significantly improves the user experience for sellers uploading product images. It provides both intuitive drag-and-drop interaction and accessible button controls, ensuring all users can effectively manage their product image order.