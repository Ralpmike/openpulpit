"use client";

import { BellIcon, BellOffIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/atoms/button";
import { getErrorMessage } from "@/helpers/api/getErrorMessage";
import { useSetFollowNotificationsMutation } from "@/modules/social/store/endpoints";

export interface PreacherNotificationToggleProps {
  slug: string;
  preacherName: string;
  isEnabled: boolean;
}

/** A bell per followed preacher: go-live notifications on or off (requirement 18). */
export function PreacherNotificationToggle({ slug, preacherName, isEnabled }: PreacherNotificationToggleProps) {
  const [setNotifications, { isLoading: isSetNotificationsPending }] = useSetFollowNotificationsMutation();
  async function toggle() {
    try {
      await setNotifications({ slug, notificationsEnabled: !isEnabled }).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }
  return (
    <Button
      size="icon"
      variant={isEnabled ? "secondary" : "ghost"}
      aria-pressed={isEnabled}
      aria-label={`Go-live notifications for ${preacherName}`}
      disabled={isSetNotificationsPending}
      onClick={toggle}
      data-testid="preacher-notification-toggle"
    >
      {isEnabled ? <BellIcon aria-hidden /> : <BellOffIcon aria-hidden />}
    </Button>
  );
}
