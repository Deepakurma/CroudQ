import * as React from 'react';

import clsx from 'clsx';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/shared/shadcn/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '~/shared/shadcn/drawer';

import { useIsMobile } from '~/hooks/use-mobile';

type DialogBoxProps = {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  header?: boolean;
};

export function CustomDialog({
  trigger,
  title,
  description,
  children,
  onOpenChange,
  open,
  className,
  header = true
}: DialogBoxProps) {
  const isMobile = useIsMobile();

  // Desktop View
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={clsx('max-h-[95%] overflow-auto', className)}>
          {header && (
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile View
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className={clsx('p-6 pb-8', className)}>
        {header && (
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
