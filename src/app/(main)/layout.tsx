import { AppShell } from "@/components/layout/AppShell";

export default function MainLayout({ children }: LayoutProps<"/">) {
  // The signed-in audience comes from the session once accounts land (OP-9).
  return <AppShell audience="guest">{children}</AppShell>;
}
