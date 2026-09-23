/** JECI shell: responsive social-network frame with shared header, sidebar and mobile dock. */
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#172033]">
      <AppHeader onOpenMenu={() => setMobileMenuOpen((open) => !open)} mobileMenuOpen={mobileMenuOpen} />
      <div className="mx-auto flex w-full max-w-[1440px] gap-6 px-4 py-5 pb-28 lg:px-8 lg:py-7 lg:pb-8">
        <AppSidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
