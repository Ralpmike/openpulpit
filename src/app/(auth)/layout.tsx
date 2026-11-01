import { Header } from "@/components/layout/Header";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 py-8">
        {children}
      </main>
    </>
  );
}
