"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Design {
  url: string;
  theme: string;
  room: string;
  createdAt: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function AdminGallery({ initialDesigns }: { initialDesigns: Design[] }) {
  const router = useRouter();
  const [designs, setDesigns] = useState(initialDesigns);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<
    { type: "single"; url: string } | { type: "bulk" } | null
  >(null);

  const allSelected = designs.length > 0 && selected.size === designs.length;

  function toggleSelect(url: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(url) ? next.delete(url) : next.add(url);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(designs.map((d) => d.url)));
  }

  async function deleteDesign(url: string): Promise<boolean> {
    const res = await fetch("/api/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    return res.ok;
  }

  async function handleDelete(url: string) {
    setDeleting((prev) => [...prev, url]);
    const ok = await deleteDesign(url);
    if (ok) {
      setDesigns((prev) => prev.filter((d) => d.url !== url));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(url);
        return next;
      });
      toast.success("Design deleted.");
    } else {
      toast.error("Failed to delete design.");
    }
    setDeleting((prev) => prev.filter((u) => u !== url));
  }

  async function handleBulkDelete() {
    const urls = [...selected];
    setDeleting(urls);
    const results = await Promise.all(urls.map(deleteDesign));
    const succeeded = urls.filter((_, i) => results[i]);
    const failed = urls.filter((_, i) => !results[i]);

    setDesigns((prev) => prev.filter((d) => !succeeded.includes(d.url)));
    setSelected(new Set(failed));
    setDeleting([]);

    if (failed.length === 0) {
      toast.success(
        `Deleted ${succeeded.length} design${succeeded.length !== 1 ? "s" : ""}.`
      );
    } else {
      toast.error(
        `${failed.length} deletion${failed.length !== 1 ? "s" : ""} failed.`
      );
    }
  }

  async function handleConfirm() {
    if (!pendingDelete) return;
    setPendingDelete(null);
    if (pendingDelete.type === "single") {
      await handleDelete(pendingDelete.url);
    } else {
      await handleBulkDelete();
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Admin Gallery</h1>
            <p className="text-muted-foreground text-sm">
              {designs.length} design{designs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {designs.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all" className="cursor-pointer text-sm">
                {allSelected ? "Deselect all" : "Select all"}
              </label>
              {selected.size > 0 && (
                <span className="text-muted-foreground text-sm">
                  {selected.size} selected
                </span>
              )}
            </div>
            {selected.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setPendingDelete({ type: "bulk" })}
                disabled={deleting.length > 0}
              >
                <Trash2 className="h-4 w-4" />
                Delete {selected.size} selected
              </Button>
            )}
          </div>
        )}

        {designs.length === 0 ? (
          <div className="flex min-h-100 flex-col items-center justify-center gap-3 text-center">
            <p className="text-muted-foreground text-sm">
              No designs in the gallery yet.
            </p>
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {designs.map((design, i) => (
                <Card key={design.url} className="overflow-hidden">
                  <CardContent className="relative p-0">
                    <div className="relative aspect-4/3">
                      <Image
                        src={design.url}
                        alt={`${design.theme} ${design.room}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                        priority={i < 3}
                      />
                    </div>
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selected.has(design.url)}
                        onCheckedChange={() => toggleSelect(design.url)}
                        className="bg-background/80 backdrop-blur-sm"
                      />
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() =>
                            setPendingDelete({
                              type: "single",
                              url: design.url,
                            })
                          }
                          disabled={deleting.includes(design.url)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete design</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete design</TooltipContent>
                    </Tooltip>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-2 pt-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{design.theme}</Badge>
                      <Badge variant="outline">{design.room}</Badge>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {formatDate(design.createdAt)}
                    </span>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TooltipProvider>
        )}
      </div>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingDelete?.type === "bulk"
                ? `Delete ${selected.size} design${selected.size !== 1 ? "s" : ""}?`
                : "Delete this design?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
