import { apiFetch } from "./api";

/**
 * Uploads a file straight from the browser to ImageKit using short-lived
 * signed params from our own backend (`GET /api/admin/imagekit/auth`), so the
 * private key never touches the client.
 * @param {File} file
 * @param {() => Promise<string | null>} getToken - Clerk token getter
 * @returns {Promise<{ url: string; fileId: string }>}
 */
export async function uploadProductImage(file, getToken) {
  const auth = await apiFetch("/api/admin/imagekit/auth", { getToken });

  const form = new FormData();
  form.append("file", file);
  form.append("fileName", file.name);
  form.append("publicKey", auth.publicKey);
  form.append("signature", auth.signature);
  form.append("expire", String(auth.expire));
  form.append("token", auth.token);
  form.append("useUniqueFileName", "true");
  form.append("folder", "/allure/products");

  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: form,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Image upload failed");
  }

  return { url: data.url, fileId: data.fileId };
}
