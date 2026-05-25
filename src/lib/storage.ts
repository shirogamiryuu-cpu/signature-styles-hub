import { supabase } from "@/integrations/supabase/client";

/**
 * Parse a Supabase storage public URL to extract the object path.
 * Returns null if it does not look like a storage URL for the given bucket.
 */
export function storagePathFromUrl(bucket: string, url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function uploadImage(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImageByUrl(bucket: string, url: string | null | undefined): Promise<void> {
  const path = storagePathFromUrl(bucket, url);
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
