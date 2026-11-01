import type { Metadata } from "next";

import { ReviewQueues } from "@/modules/admin/components/ReviewQueues";

export const metadata: Metadata = { title: "Reviews · Admin" };

export default function AdminReviewsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <ReviewQueues />
    </div>
  );
}
