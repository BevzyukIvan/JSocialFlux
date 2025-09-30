// frontend/src/api/photos.ts
export type PhotoCardDTO = {
    id: number;
    url: string;
    uploadedAt: string;      // ISO
    description: string | null;
};

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();

/** Завантажити фото (multipart/form-data) */
export async function createPhoto(
    file: File,
    description?: string
): Promise<PhotoCardDTO> {
    const fd = new FormData();
    fd.append("file", file);
    if (description?.trim()) if (description != null) {
        fd.append("description", description.trim());
    }

    const res = await fetch(`${BASE}/api/photos`, {
        method: "POST",
        body: fd,
        credentials: "include",
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return (await res.json()) as PhotoCardDTO;
}
