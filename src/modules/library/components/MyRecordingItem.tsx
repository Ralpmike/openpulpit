"use client";

import { EyeIcon, EyeOffIcon, MoreVerticalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/atoms/alert-dialog";
import { Button } from "@/components/ui/atoms/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/atoms/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/atoms/dropdown-menu";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { formatShortDate } from "@/helpers/format/date";
import { formatDuration } from "@/helpers/format/duration";
import { BroadcastDetailsForm } from "@/modules/broadcasting/components/BroadcastDetailsForm";
import type { MyRecording } from "@/modules/library/models";
import type { RecordingDetailsFormValues } from "@/modules/library/schemas/recording";
import { RecordingStatusBadge } from "@/modules/library/components/RecordingStatusBadge";
import {
  useDeleteRecordingMutation,
  useSetRecordingHiddenMutation,
  useUpdateRecordingMutation,
} from "@/modules/library/store/endpoints";

export function MyRecordingItem({ recording }: { recording: MyRecording }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [updateRecording, { isLoading: isUpdateRecordingPending }] = useUpdateRecordingMutation();
  const [setHidden, { isLoading: isSetHiddenPending }] = useSetRecordingHiddenMutation();
  const [deleteRecording, { isLoading: isDeleteRecordingPending }] = useDeleteRecordingMutation();
  const isAdminHidden = recording.visibility === "hidden_by_admin";
  const isHidden = recording.visibility !== "public";
  const canManage = recording.status === "ready" || recording.status === "failed";

  async function save(values: RecordingDetailsFormValues) {
    try {
      await updateRecording({ id: recording.id, ...values }).unwrap();
      toast.success("Recording updated");
      setIsEditOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function toggleHidden() {
    try {
      await setHidden({ id: recording.id, isHidden: !isHidden }).unwrap();
      toast.success(isHidden ? "Recording is public again" : "Recording hidden from listeners");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function remove() {
    try {
      await deleteRecording(recording.id).unwrap();
      toast.success("Recording deleted");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <li className="flex items-start gap-3 border-b py-3 last:border-b-0" data-testid="my-recording">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {recording.status === "ready" && !isHidden ? (
          <Link href={`/r/${recording.id}`} className="line-clamp-2 font-medium underline-offset-4 hover:underline">
            {recording.title}
          </Link>
        ) : (
          <span className="line-clamp-2 font-medium">{recording.title}</span>
        )}
        <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <RecordingStatusBadge recording={recording} />
          <span>{formatShortDate(recording.createdAt)}</span>
          {recording.durationSeconds ? <span>{formatDuration(recording.durationSeconds)}</span> : null}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={`Options for ${recording.title}`} disabled={!canManage} data-testid="recording-options">
            <MoreVerticalIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setIsEditOpen(true)}>
            <PencilIcon aria-hidden />
            Edit title and description
          </DropdownMenuItem>
          {!isAdminHidden ? (
            <DropdownMenuItem onSelect={toggleHidden} disabled={isSetHiddenPending}>
              {isHidden ? <EyeIcon aria-hidden /> : <EyeOffIcon aria-hidden />}
              {isHidden ? "Show to listeners" : "Hide from listeners"}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem variant="destructive" onSelect={() => setIsDeleteOpen(true)}>
            <Trash2Icon aria-hidden />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit recording</DrawerTitle>
            <DrawerDescription>Listeners see the new title and description at once.</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto w-full max-w-xl overflow-y-auto px-4 pb-6">
            <BroadcastDetailsForm
              onSubmit={save}
              isSubmitting={isUpdateRecordingPending}
              submitLabel="Save"
              defaultValues={{ title: recording.title, description: recording.description, biblePassage: recording.biblePassage }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{recording.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Listeners won&apos;t be able to play it any more, and its share link will stop working. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={remove} disabled={isDeleteRecordingPending} data-testid="confirm-delete-recording">
              Delete recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
