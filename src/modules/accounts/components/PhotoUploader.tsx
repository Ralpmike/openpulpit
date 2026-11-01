"use client";

import { CameraIcon } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { resizeImage } from "@/helpers/image/resizeImage";
import { useUploadMyPhotoMutation } from "@/modules/accounts/store/endpoints";

export interface PhotoUploaderProps {
  name: string;
  photoUrl: string | null;
}

export function PhotoUploader({ name, photoUrl }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadMyPhoto, { isLoading: isUploadPhotoPending }] = useUploadMyPhotoMutation();

  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    try {
      const resized = await resizeImage(file);
      await uploadMyPhoto(resized).unwrap();
      toast.success("Photo updated");
    } catch (error) {
      toast.error(error instanceof Error && !("status" in error) ? "Couldn't read that photo. Try another." : getErrorMessage(error));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4" data-testid="photo-uploader">
      <PreacherAvatar name={name || "?"} photoUrl={photoUrl} size="lg" />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        id="profile-photo"
        onChange={(event) => onFileChosen(event.target.files?.[0])}
      />
      <LoaderButton variant="outline" onClick={() => inputRef.current?.click()} isLoading={isUploadPhotoPending} loadingLabel="Uploading…" data-testid="change-photo-button">
        <CameraIcon data-icon="inline-start" aria-hidden />
        {photoUrl ? "Change photo" : "Add a photo"}
      </LoaderButton>
    </div>
  );
}
