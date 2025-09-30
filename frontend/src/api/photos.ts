// frontend/src/api/photos.ts

export type PhotoCardDTO = {
    id: number;
    url: string;
    uploadedAt: string; // ISO
    description: string | null;
};

const BASE = (import.meta.env.VITE_API_BASE ?? "").trim();
const url = (path: string) => (BASE ? `${BASE}${path}` : path);

/** Завантажити фото (multipart/form-data) */
export async function createPhoto(
    file: File,
    description?: string
): Promise<PhotoCardDTO> {
    const fd = new FormData();
    fd.append("file", file);
    if (description && description.trim()) {
        fd.append("description", description.trim());
    }

    const res = await fetch(url("/api/photos"), {
        method: "POST",
        body: fd,                // не виставляємо Content-Type вручну
        credentials: "include",
    });
    if (!res.ok) throw new Error(`Upload failed (${res.status})`);
    return (await res.json()) as PhotoCardDTO;
}
