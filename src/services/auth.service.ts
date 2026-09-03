import { apiRequest } from "@/lib/api/client";
import { publicUserSchema } from "@/schemas/auth";
import type { PublicUser } from "@/types/auth";

export async function login(email: string, password: string): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  return publicUserSchema.parse(data.user);
}

export async function logout(): Promise<void> {
  await apiRequest<{ loggedOut: boolean }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser(): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>("/api/auth/me");
  return publicUserSchema.parse(data.user);
}

export async function updateProfile(input: {
  firstName: string;
  lastName: string;
  phone?: string | null;
}): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return publicUserSchema.parse(data.user);
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiRequest<{ changed: boolean }>("/api/auth/password", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function uploadAvatar(file: File): Promise<PublicUser> {
  const contentType = file.type === "image/jpg" ? "image/jpeg" : file.type;
  const upload = await apiRequest<{ uploadUrl: string; objectKey: string }>(
    "/api/auth/avatar/upload-url",
    {
      method: "POST",
      body: JSON.stringify({ contentType, contentLength: file.size }),
    },
  );

  const putResponse = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error("Unable to upload profile picture.");
  }

  const data = await apiRequest<{ user: PublicUser }>("/api/auth/avatar/confirm", {
    method: "POST",
    body: JSON.stringify({ objectKey: upload.objectKey, contentType }),
  });
  return publicUserSchema.parse(data.user);
}

export async function removeAvatar(): Promise<PublicUser> {
  const data = await apiRequest<{ user: PublicUser }>("/api/auth/avatar", { method: "DELETE" });
  return publicUserSchema.parse(data.user);
}
