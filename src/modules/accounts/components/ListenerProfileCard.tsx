"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CameraIcon } from "lucide-react";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/atoms/card";
import { FieldGroup } from "@/components/ui/atoms/field";
import { FormFieldInput } from "@/components/ui/molecules/FormFieldInput";
import { LoaderButton } from "@/components/ui/molecules/LoaderButton";
import { PreacherAvatar } from "@/components/ui/molecules/PreacherAvatar";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { resizeImage } from "@/helpers/image/resizeImage";
import { accountNameSchema, type AccountNameFormValues } from "@/modules/accounts/schemas/auth";
import {
  useGetMeQuery,
  useRemoveAccountPhotoMutation,
  useUpdateMyNameMutation,
  useUploadAccountPhotoMutation,
} from "@/modules/accounts/store/endpoints";

export interface ListenerProfileCardProps {
  initialName: string;
  initialPhotoUrl: string | null;
}

/** Name and optional photo (requirement 5). */
export function ListenerProfileCard({ initialName, initialPhotoUrl }: ListenerProfileCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: me } = useGetMeQuery();
  const [updateMyName, { isLoading: isUpdateNamePending }] = useUpdateMyNameMutation();
  const [uploadAccountPhoto, { isLoading: isUploadPhotoPending }] = useUploadAccountPhotoMutation();
  const [removeAccountPhoto, { isLoading: isRemovePhotoPending }] = useRemoveAccountPhotoMutation();
  const form = useForm<AccountNameFormValues>({ resolver: zodResolver(accountNameSchema), defaultValues: { name: initialName } });
  const photoUrl = me ? me.image : initialPhotoUrl;
  const name = me?.name ?? initialName;

  async function saveName(values: AccountNameFormValues) {
    try {
      await updateMyName(values).unwrap();
      toast.success("Name saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    try {
      await uploadAccountPhoto(await resizeImage(file)).unwrap();
      toast.success("Photo updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card data-testid="listener-profile-card">
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <PreacherAvatar name={name} photoUrl={photoUrl} size="lg" />
          <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFileChosen(e.target.files?.[0])} aria-label="Choose a photo" />
          <div className="flex flex-col gap-2">
            <LoaderButton variant="outline" size="sm" onClick={() => inputRef.current?.click()} isLoading={isUploadPhotoPending} loadingLabel="Uploading…">
              <CameraIcon data-icon="inline-start" aria-hidden />
              {photoUrl ? "Change photo" : "Add a photo (optional)"}
            </LoaderButton>
            {photoUrl ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={isRemovePhotoPending}
                onClick={() => removeAccountPhoto().unwrap().catch((error) => toast.error(getErrorMessage(error)))}
              >
                Remove photo
              </Button>
            ) : null}
          </div>
        </div>
        <form onSubmit={form.handleSubmit(saveName)} noValidate>
          <FieldGroup>
            <FormFieldInput control={form.control} name="name" label="Your name" autoComplete="name" data-testid="account-name" />
            <LoaderButton type="submit" variant="secondary" isLoading={isUpdateNamePending} loadingLabel="Saving…" data-testid="save-name-button">
              Save name
            </LoaderButton>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
