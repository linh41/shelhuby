'use client';
// Pill badge showing blob category with a colored dot + label
import { type BlobCategory } from '@/app/types';

// Color map per PRD specification
const CATEGORY_COLORS: Record<BlobCategory, string> = {
  image:     '#3498DB',
  video:     '#9B59B6',
  audio:     '#E91E63',
  document:  '#2ECC71',
  data:      '#F39C12',
  code:      '#1ABC9C',
  archive:   '#95A5A6',
  'ai-model':'#E74C3C',
  unknown:   '#BDC3C7',
};

const CATEGORY_LABELS: Record<BlobCategory, string> = {
  image:     'Image',
  video:     'Video',
  audio:     'Audio',
  document:  'Document',
  data:      'Data',
  code:      'Code',
  archive:   'Archive',
  'ai-model':'AI Model',
  unknown:   'Unknown',
};

interface BlobTypeBadgeProps {
  category: BlobCategory;
}

export function BlobTypeBadge({ category }: BlobTypeBadgeProps) {
  const color = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.unknown;
  const label = CATEGORY_LABELS[category] ?? 'Unknown';

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}22`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

// Expose color map for use in other components (e.g., border coloring)
export function getCategoryColor(category: BlobCategory): string {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.unknown;
}
