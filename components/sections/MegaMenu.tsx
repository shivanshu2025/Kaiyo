'use client';

import { type Variants } from 'framer-motion';
import MegaMenuColumn from './MegaMenuColumn';
import { type SolutionMenuCategory } from './solutions-menu.config';

interface MegaMenuProps {
  categories: SolutionMenuCategory[];
  pathname: string | null;
  className: string;
  columnClassName?: string;
  titleClassName: string;
  listClassName: string;
  itemClassName: string;
  activeItemClassName: string;
  inactiveItemClassName: string;
  itemMotionVariants?: Variants;
  onItemClick?: () => void;
}

export default function MegaMenu({
  categories,
  pathname,
  className,
  columnClassName,
  titleClassName,
  listClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  itemMotionVariants,
  onItemClick,
}: MegaMenuProps) {
  return (
    <div className={className}>
      {categories.map((category) => (
        <MegaMenuColumn
          key={category.title}
          category={category}
          pathname={pathname}
          className={columnClassName}
          titleClassName={titleClassName}
          listClassName={listClassName}
          itemClassName={itemClassName}
          activeItemClassName={activeItemClassName}
          inactiveItemClassName={inactiveItemClassName}
          itemMotionVariants={itemMotionVariants}
          onItemClick={onItemClick}
        />
      ))}
    </div>
  );
}
