import React from 'react';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppLogo } from '@/components/icons';
import { DashboardNav } from '@/components/dashboard-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2" prefetch={false}>
            <AppLogo className="h-6 w-6" />
            <span className="font-bold font-headline text-lg group-data-[collapsible=icon]:hidden">
              Echoes of Yesterday
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
