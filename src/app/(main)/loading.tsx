import { SectionLoadingSkeleton } from "@/components/ui/molecules/SectionLoadingSkeleton";

export default function Loading() {
  return <SectionLoadingSkeleton rows={4} label="Loading page" className="pt-2" />;
}
