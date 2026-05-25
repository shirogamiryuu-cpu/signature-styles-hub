import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImage, deleteImageByUrl } from "@/lib/storage";
import { toast } from "sonner";

type Props = {
  bucket: "barber-images" | "style-images";
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
};

export function ImageUploader({ bucket, value, onChange, label = "Image" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const oldUrl = value;
      const url = await uploadImage(bucket, file);
      onChange(url);
      if (oldUrl) await deleteImageByUrl(bucket, oldUrl);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!value) return;
    setBusy(true);
    try {
      await deleteImageByUrl(bucket, value);
      onChange(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt="" className="h-20 w-20 rounded-md object-cover border" />
        ) : (
          <div className="h-20 w-20 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy}
            onClick={() => inputRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span className="ml-1">{value ? "Replace" : "Upload"}</span>
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={busy}>
              <X className="h-4 w-4" /> Remove
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
