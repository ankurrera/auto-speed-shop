import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageItem {
  id: string;
  url: string;
  index: number;
}

interface DraggableImageItemProps {
  image: ImageItem;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

function DraggableImageItem({ 
  image, 
  onRemove, 
  onMoveUp, 
  onMoveDown,
  isFirst,
  isLast 
}: DraggableImageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border border-neutral-700 rounded overflow-hidden bg-white dark:bg-neutral-800 ${
        isDragging ? 'shadow-lg ring-2 ring-primary' : ''
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 p-1 bg-black/60 text-white rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Image */}
      <div className="w-24 h-24">
        <img
          src={image.url}
          alt=""
          className="object-cover w-full h-full"
          draggable={false}
          loading="lazy"
          decoding="async"
          width="96"
          height="96"
        />
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <div className="flex flex-col gap-1">
          {/* Up/Down Buttons */}
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0"
              onClick={() => onMoveUp(image.index)}
              disabled={isFirst}
              title="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-6 w-6 p-0"
              onClick={() => onMoveDown(image.index)}
              disabled={isLast}
              title="Move down"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Remove Button */}
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="h-6 text-xs px-2 py-0"
            onClick={() => onRemove(image.index)}
            title="Remove image"
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Image Index Badge */}
      <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
        {image.index + 1}
      </div>
    </div>
  );
}

interface DraggableImageListProps {
  images: string[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
}

export function DraggableImageList({ images, onReorder, onRemove }: DraggableImageListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Convert image URLs to items with unique IDs
  const items: ImageItem[] = images.map((url, index) => ({
    id: `image-${index}-${url.slice(-10)}`, // Use URL suffix for uniqueness
    url,
    index,
  }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      
      const newOrder = arrayMove(images, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newOrder = [...images];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      onReorder(newOrder);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < images.length - 1) {
      const newOrder = [...images];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      onReorder(newOrder);
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">
        Image Preview ({images.length} image{images.length !== 1 ? 's' : ''})
      </div>
      <div className="text-xs text-muted-foreground">
        Drag images to reorder them, or use the arrow buttons. The first image will be the main product image.
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(item => item.id)} 
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex flex-wrap gap-3">
            {items.map((item, arrayIndex) => (
              <DraggableImageItem
                key={item.id}
                image={item}
                onRemove={onRemove}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                isFirst={arrayIndex === 0}
                isLast={arrayIndex === images.length - 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}