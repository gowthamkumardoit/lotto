"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { doc, updateDoc } from "firebase/firestore";

type RedirectType = "DRAW" | "EXTERNAL" | "NONE";

interface Props {
  open: boolean;
  onClose: () => void;
  editingBanner?: any;
}

export default function CreateBannerDialog({
  open,
  onClose,
  editingBanner,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    redirectType: "NONE" as RedirectType,
    redirectValue: "",
    startDate: "",
    endDate: "",
    active: true,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (editingBanner) {
      setForm({
        title: editingBanner.title || "",
        subtitle: editingBanner.subtitle || "",
        redirectType: editingBanner.redirectType || "NONE",
        redirectValue: editingBanner.redirectValue || "",
        startDate: editingBanner.startDate || "",
        endDate: editingBanner.endDate || "",
        active: editingBanner.active ?? true,
      });

      setExistingImages(editingBanner.images || []);
      setPreviews(editingBanner.images || []);
    }
  }, [editingBanner]);

  if (!open) return null;

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const resetState = () => {
    setFiles([]);
    setExistingImages([]);
    setPreviews([]);
    setForm({
      title: "",
      subtitle: "",
      redirectType: "NONE",
      redirectValue: "",
      startDate: "",
      endDate: "",
      active: true,
    });
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = async () => {
    if (!form.title || (existingImages.length === 0 && files.length === 0)) {
      toast.error("Title and at least one image are required");
      return;
    }

    try {
      setLoading(true);

      let uploadedUrls: string[] = [...existingImages];

      // Upload only new files
      for (const file of files) {
        const storageRef = ref(
          storage,
          `promotions/${Date.now()}_${file.name}`,
        );

        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(downloadUrl);
      }

      if (editingBanner) {
        // 🔥 UPDATE
        await updateDoc(doc(db, "promotions", editingBanner.id), {
          title: form.title,
          subtitle: form.subtitle,
          images: uploadedUrls,
          redirectType: form.redirectType,
          redirectValue: form.redirectValue,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          active: form.active,
          updatedAt: serverTimestamp(),
        });

        toast.success("Banner updated successfully");
      } else {
        // 🔥 CREATE
        await addDoc(collection(db, "promotions"), {
          title: form.title,
          subtitle: form.subtitle,
          images: uploadedUrls,
          redirectType: form.redirectType,
          redirectValue: form.redirectValue,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          active: form.active,
          order: Date.now(),
          createdAt: serverTimestamp(),
        });

        toast.success("Banner created successfully");
      }

      resetState();
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-card border border-border shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">
            {editingBanner ? "Edit Carousel Banner" : "Create Carousel Banner"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 p-6">
          {/* LEFT SIDE - FORM */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Subtitle</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.subtitle}
                onChange={(e) => handleChange("subtitle", e.target.value)}
              />
            </div>

            {/* Upload Button */}
            <div>
              <label className="text-sm font-medium">Upload Images</label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-6 cursor-pointer hover:bg-muted transition"
              >
                <Upload size={18} />
                <span className="text-sm text-muted-foreground">
                  Click to upload multiple images
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Image Preview Grid */}
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((img, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={img}
                      alt="preview"
                      className="w-full h-24 object-cover"
                    />

                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-background/80 rounded-full p-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE - LIVE CAROUSEL PREVIEW */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-sm font-medium mb-3">Live Preview</div>

            {previews.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                Upload images to preview carousel
              </div>
            ) : (
              <CarouselPreview
                images={previews}
                title={form.title}
                subtitle={form.subtitle}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm border border-border bg-background hover:bg-muted"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading
              ? editingBanner
                ? "Updating..."
                : "Creating..."
              : editingBanner
                ? "Update Banner"
                : "Create Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CarouselPreview({
  images,
  title,
  subtitle,
}: {
  images: string[];
  title: string;
  subtitle: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [images]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{
          transform: `translateX(-${index * 100}%)`,
        }}
      >
        {images.map((img, i) => (
          <div key={i} className="min-w-full relative">
            <img
              src={img}
              alt="carousel"
              className="w-full h-48 object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-4 text-white">
              <div className="text-lg font-semibold">{title || "Title"}</div>
              <div className="text-sm opacity-80">{subtitle || "Subtitle"}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition ${
              i === index ? "bg-primary" : "bg-muted-foreground/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
