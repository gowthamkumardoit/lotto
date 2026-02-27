"use client";

import { useState, useEffect } from "react";
import { Megaphone, Plus, Trash2, GripVertical, Pencil } from "lucide-react";
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import CreateBannerDialog from "@/components/promotions/CreateBannerDialog";

type Banner = {
  id: string;
  title: string;
  subtitle?: string;
  images: string[];
  active: boolean;
  order: number;
};

export default function PromotionsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deletingBanner, setDeletingBanner] = useState<Banner | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ Load banners from Firestore (real-time)
  useEffect(() => {
    const q = query(collection(db, "promotions"), orderBy("order", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Banner[];

      setBanners(data);
    });

    return () => unsubscribe();
  }, []);

  // ✅ Toggle Active
  const activateBanner = async (banner: Banner) => {
    try {
      // If already active, do nothing
      if (banner.active) {
        toast.info("This banner is already active");
        return;
      }

      // 1️⃣ Deactivate all banners
      const updates = banners.map((b) =>
        updateDoc(doc(db, "promotions", b.id), {
          active: b.id === banner.id,
        }),
      );

      await Promise.all(updates);

      toast.success("Banner activated successfully");
    } catch (error) {
      toast.error("Failed to activate banner");
    }
  };

  // ✅ Delete Banner
  const confirmDeleteBanner = async () => {
    if (!deletingBanner) return;

    try {
      setDeleteLoading(true);

      for (const url of deletingBanner.images) {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      }

      await deleteDoc(doc(db, "promotions", deletingBanner.id));

      toast.success("Banner deleted successfully");
      setDeletingBanner(null);
    } catch (error) {
      toast.error("Failed to delete banner");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Megaphone className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Carousel Promotions
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingBanner(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} />
          Create Banner
        </button>
      </div>

      {/* Banner List */}
      <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border">
        {banners.length === 0 && (
          <div className="py-14 text-center text-muted-foreground">
            No carousel banners created
          </div>
        )}

        {banners.map((banner) => (
          <div
            key={banner.id}
            className="flex items-center gap-4 p-4 hover:bg-muted/40 transition"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />

            {/* Preview Image (first image) */}
            <BannerCarousel images={banner.images} />

            <div className="flex-1">
              <div className="font-medium">{banner.title}</div>
              {banner.subtitle && (
                <div className="text-xs text-muted-foreground">
                  {banner.subtitle}
                </div>
              )}
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                banner.active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {banner.active ? "Active" : "Inactive"}
            </span>

            <div className="flex gap-3 items-center">
              {/* Toggle */}
              <button
                onClick={() => activateBanner(banner)}
                className={`text-sm ${
                  banner.active
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {banner.active ? "Active" : "Activate"}
              </button>

              {/* Edit */}
              <button
                onClick={() => {
                  setEditingBanner(banner);
                  setOpen(true);
                }}
                className="text-muted-foreground hover:text-primary"
              >
                <Pencil size={16} />
              </button>

              {/* Delete */}
              <button
                onClick={() => setDeletingBanner(banner)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog */}
      <CreateBannerDialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingBanner(null);
        }}
        editingBanner={editingBanner}
      />

      {deletingBanner && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Banner?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently remove this banner and its images.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingBanner(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm"
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteBanner}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-destructive text-white text-sm disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BannerCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [images]);

  if (!images?.length) return null;

  return (
    <div className="relative w-32 h-16 overflow-hidden rounded-lg border border-border">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt="banner"
            className="min-w-full h-16 object-cover"
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === index ? "bg-primary" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
