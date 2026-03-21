"use client";

import { useRef, useState } from "react";
import { BROWSER_API_BASE_URL } from "@/lib/api/config";

const getResourceType = (file) =>
  file?.type?.startsWith("image/") ? "image" : "raw";

async function requestUploadSignature(folder, resourceType) {
  const response = await fetch(`${BROWSER_API_BASE_URL}/api/uploads/sign`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      folder,
      resourceType,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Failed to prepare upload.");
  }

  return data?.data;
}

async function uploadFileToCloudinary(file, folder) {
  const resourceType = getResourceType(file);
  const signatureData = await requestUploadSignature(folder, resourceType);
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signatureData.apiKey);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("signature", signatureData.signature);
  formData.append("folder", signatureData.folder);

  const response = await fetch(signatureData.uploadUrl, {
    method: "POST",
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message || "Cloudinary upload failed.");
  }

  return {
    name: file.name,
    publicId: data.public_id,
    resourceType: data.resource_type || resourceType,
    url: data.secure_url,
  };
}

export function CloudinaryFileUploader({
  accept = ".pdf,.png,.jpg,.jpeg,.webp",
  buttonLabel = "Upload File",
  disabled,
  folder,
  onUploaded,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSelectFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setIsUploading(true);

    try {
      const upload = await uploadFileToCloudinary(file, folder);
      onUploaded(upload);
    } catch (uploadError) {
      setError(uploadError.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <label
        className="btn btn-secondary btn-sm"
        style={{
          display: "inline-flex",
          alignItems: "center",
          cursor: disabled || isUploading ? "not-allowed" : "pointer",
          opacity: disabled || isUploading ? 0.7 : 1,
        }}
      >
        {isUploading ? "Uploading..." : buttonLabel}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleSelectFile}
          disabled={disabled || isUploading}
          style={{ display: "none" }}
        />
      </label>
      {error ? (
        <p
          className="text-light"
          style={{ color: "var(--color-error)", marginTop: "var(--space-2)" }}
        >
          Upload failed. Please try again.
        </p>
      ) : null}
    </div>
  );
}
