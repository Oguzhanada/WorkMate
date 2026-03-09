'use client';

import type React from 'react';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import WidgetRenderer from '@/components/dashboard/widgets/WidgetRenderer';
import { getWidgetLabel, type WidgetType } from '@/lib/dashboard/widgets';
import type { DashboardWidgetRow } from './widget-types';

type Props = {
  widgets: DashboardWidgetRow[];
  onReorder: (widgets: DashboardWidgetRow[]) => void;
  onRemove: (widgetId: string) => void;
  disabled?: boolean;
};

function SortableWidgetCard({
  widget,
  onRemove,
  disabled,
}: {
  widget: DashboardWidgetRow;
  onRemove: (widgetId: string) => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${Math.max(1, Math.min(12, widget.position?.w ?? 6))}`,
  };

  return (
    <motion.div
      layout
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      whileHover={{ scale: 1.01, y: -2 }}
      whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: '0 24px 48px rgba(0,0,0,0.1)' }}
      className={isDragging ? 'z-50 cursor-grabbing' : ''}
    >
      <Card
        className={`h-full rounded-[1.4rem] transition-shadow duration-300 ${
          isDragging ? 'shadow-xl' : 'hover:shadow-[var(--wm-shadow-lg)]'
        }`}
        style={{ border: '1px solid var(--wm-border)', background: 'rgba(255,255,255,0.96)' }}
      >
        <div className="mb-3 flex items-center justify-between gap-2 border-b pb-2.5" style={{ borderColor: 'rgba(15,23,42,0.08)' }}>
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-lg p-1 active:cursor-grabbing" style={{ color: 'var(--wm-subtle)' }}
            disabled={disabled}
            aria-label={`Drag ${widget.widget_type}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <p className="text-sm font-bold" style={{ color: '#0f172a' }}>{getWidgetLabel(widget.widget_type as WidgetType)}</p>
          <button
            type="button"
            className="rounded-lg p-1 hover:text-red-500" style={{ color: 'var(--wm-subtle)' }}
            onClick={() => onRemove(widget.id)}
            disabled={disabled}
            aria-label={`Remove ${widget.widget_type}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <WidgetRenderer widgetType={widget.widget_type as WidgetType} settings={widget.settings} />
      </Card>
    </motion.div>
  );
}

export default function WidgetGrid({ widgets, onReorder, onRemove, disabled }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = widgets.findIndex((item) => item.id === active.id);
    const newIndex = widgets.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const moved = arrayMove(widgets, oldIndex, newIndex).map((item, index) => ({
      ...item,
      position: {
        ...(item.position ?? { x: 0, y: index, w: 6, h: 2 }),
        y: index,
      },
    }));

    onReorder(moved);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map((item) => item.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {widgets.map((widget) => (
            <SortableWidgetCard
              key={widget.id}
              widget={widget}
              onRemove={onRemove}
              disabled={disabled}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
