const CLOUDINARY_BASE = import.meta.env.VITE_CLOUDINARY_URL as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;

const getCloudName = (): string => {
  const match = CLOUDINARY_BASE.match(/res\.cloudinary\.com\/([^/]+)/);
  return match?.[1] ?? '';
};

export const uploadImage = async (file: File, folder?: string): Promise<string> => {
  const cloudName = getCloudName();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (folder) formData.append('folder', folder);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Error subiendo imagen a Cloudinary');
  }

  const data = await response.json();
  return data.secure_url as string;
};
