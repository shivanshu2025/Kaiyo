'use client';

import { type Variants } from 'framer-motion';
import MegaMenuItem from './MegaMenuItem';
import { type SolutionMenuCategory } from './solutions-menu.config';

interface MegaMenuColumnProps {
  category: SolutionMenuCategory;
  pathname: string | null;
  className?: string;
  titleClassName: string;
  listClassName: string;
  itemClassName: string;
  activeItemClassName: string;
  inactiveItemClassName: string;
  itemMotionVariants?: Variants;
  onItemClick?: () => void;
}

export default function MegaMenuColumn({
  category,
  pathname,
  className,
  titleClassName,
  listClassName,
  itemClassName,
  activeItemClassName,
  inactiveItemClassName,
  itemMotionVariants,
  onItemClick,
}: MegaMenuColumnProps) {
  return (
    <div className={className}>
      <h3 className={titleClassName}>{category.title}</h3>
      <ul className={listClassName}>
        {category.items.map((item) => (
          <MegaMenuItem
            key={item.label}
            item={item}
            pathname={pathname}
            className={itemClassName}
            activeClassName={activeItemClassName}
            inactiveClassName={inactiveItemClassName}
            motionVariants={itemMotionVariants}
            onClick={onItemClick}
          />
        ))}
      </ul>
    </div>
  );
}
