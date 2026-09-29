import { AppNav } from "@/components/layout/AppNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppNav />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
