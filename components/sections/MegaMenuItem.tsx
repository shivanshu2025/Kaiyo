'use client';

import { motion, type Variants } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  isSolutionItemActive,
  type SolutionMenuItem,
} from './solutions-menu.config';

interface MegaMenuItemProps {
  item: SolutionMenuItem;
  pathname: string | null;
  className: string;
  activeClassName: string;
  inactiveClassName: string;
  motionVariants?: Variants;
  onClick?: () => void;
}

export default function MegaMenuItem({
  item,
  pathname,
  className,
  activeClassName,
  inactiveClassName,
  motionVariants,
  onClick,
}: MegaMenuItemProps) {
  const isActive = isSolutionItemActive(item, pathname);
  const content = (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        className,
        isActive ? activeClassName : inactiveClassName
      )}
    >
      {item.label}
    </Link>
  );

  if (!motionVariants) {
    return <li>{content}</li>;
  }

  return <motion.li variants={motionVariants}>{content}</motion.li>;
}
