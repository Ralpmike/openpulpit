"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/atoms/alert";
import { Button } from "@/components/ui/atoms/button";
import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { PhotoUploader } from "@/modules/accounts/components/PhotoUploader";
import { PreacherProfileForm } from "@/modules/accounts/components/PreacherProfileForm";
import type { PreacherProfileFormValues } from "@/modules/accounts/schemas/profile";
import { useGetMyProfileQuery, useSaveMyProfileMutation } from "@/modules/accounts/store/endpoints";

export interface ProfileEditPageProps {
  accountName: string;
}

export function ProfileEditPage({ accountName }: ProfileEditPageProps) {
  const router = useRouter();
  const { data: profile, isLoading: isProfileLoading, isError: isProfileError, refetch } = useGetMyProfileQuery();
  const [saveMyProfile, { isLoading: isSaveProfilePending }] = useSaveMyProfileMutation();

  async function save(values: PreacherProfileFormValues, setError: UseFormSetError<PreacherProfileFormValues>) {
    try {
      const saved = await saveMyProfile(values).unwrap();
      toast.success("Profile saved");
      if (!profile) router.push(`/p/${saved.slug}`);
    } catch (error) {
      const data = (error as { data?: { field?: string; error?: string } }).data;
      if (data?.field === "slug") setError("slug", { message: data.error });
      else toast.error(getErrorMessage(error));
    }
  }

  if (isProfileLoading) return <SectionLoadingSkeleton rows={4} hasAvatar={false} label="Loading your profile" />;
  if (isProfileError) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex flex-col items-start gap-2">
          Your profile didn&apos;t load.
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6" data-testid="profile-edit-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{profile ? "Edit your profile" : "Set up your preacher profile"}</h1>
        <p className="text-muted-foreground">Listeners see this when they find you or follow your link.</p>
      </div>
      {profile ? (
        <PhotoUploader name={profile.displayName} photoUrl={profile.photoUrl} />
      ) : (
        <p className="text-sm text-muted-foreground">You can add a photo after saving.</p>
      )}
      <PreacherProfileForm
        isNew={!profile}
        isSubmitting={isSaveProfilePending}
        onSubmit={save}
        defaultValues={{
          displayName: profile?.displayName ?? accountName,
          slug: profile?.slug ?? "",
          ministry: profile?.ministry ?? "",
          state: (profile?.state as PreacherProfileFormValues["state"]) ?? (undefined as unknown as PreacherProfileFormValues["state"]),
          city: profile?.city ?? "",
          denomination: profile?.denomination ?? "",
          bio: profile?.bio ?? "",
        }}
      />
      {profile ? (
        <Button variant="link" asChild className="self-start px-0">
          <Link href={`/p/${profile.slug}`}>View your public page</Link>
        </Button>
      ) : null}
    </div>
  );
}
