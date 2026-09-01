"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const CreateOverlayContext = React.createContext<{ close: () => void } | null>(
  null,
);

/**
 * Доступ к закрытию overlay из вложенной формы.
 * Возвращает undefined, если компонент вне CreateOverlay.
 */
export function useCreateOverlay(): (() => void) | undefined {
  return React.useContext(CreateOverlayContext)?.close;
}

/**
 * Универсальный overlay «создать»: desktop — Dialog по центру,
 * mobile — Drawer снизу. Переключение — CSS-брейкпоинты.
 * Дочерние формы закрывают overlay через useCreateOverlay().
 */
export function CreateOverlay({
  title,
  description,
  buttonLabel,
  children,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  children: React.ReactNode;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const closeBoth = React.useCallback(() => {
    setDialogOpen(false);
    setDrawerOpen(false);
  }, []);

  const contextValue = React.useMemo(() => ({ close: closeBoth }), [closeBoth]);

  return (
    <CreateOverlayContext.Provider value={contextValue}>
      <div className="hidden md:block">
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="h-10 rounded-xl"
        >
          <Plus className="size-4" />
          {buttonLabel}
        </Button>
        <Dialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          className="glass-strong rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </Dialog>
      </div>

      <div className="block md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger
            render={
              <Button className="h-12 w-full rounded-xl">
                <Plus className="size-4" />
                {buttonLabel}
              </Button>
            }
          />
          <DrawerContent className="rounded-t-3xl p-5">
            <DrawerHeader className="text-left">
              <DrawerTitle>{title}</DrawerTitle>
              <DrawerDescription>{description}</DrawerDescription>
            </DrawerHeader>
            {children}
          </DrawerContent>
        </Drawer>
      </div>
    </CreateOverlayContext.Provider>
  );
}
