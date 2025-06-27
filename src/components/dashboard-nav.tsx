"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  Mic,
  Image,
  BookHeart,
  Sparkles,
  MessageSquare,
  Wand2,
  Video,
  Film,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/account", label: "Account", icon: User },
  { href: "/dashboard/memory-integration", label: "Memories", icon: BookHeart },
  { href: "/dashboard/chat", label: "Chat", icon: MessageSquare },
];

const generationItems = [
  { href: "/dashboard/voice-cloning", label: "Voice Cloning", icon: Mic },
  { href: "/dashboard/avatar-generation", label: "Avatar Generation", icon: Image },
  { href: "/dashboard/text-to-video", label: "Image Studio", icon: Wand2 },
  { href: "/dashboard/text-to-video-google", label: "Text to Video", icon: Video },
  { href: "/dashboard/image-to-video", label: "Image to Video (Kling)", icon: Film },
  { href: "/dashboard/image-to-video-pixverse", label: "Image to Video (Pixverse)", icon: Film },
  { href: "/dashboard/image-to-video-minimax", label: "Image to Video (Minimax)", icon: Film },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      <SidebarGroup>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href} className="block w-full">
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center gap-2">
            <Sparkles className="size-4" />
            <span>Generation Tools</span>
        </SidebarGroupLabel>
        <SidebarMenu>
          {generationItems.map((item) => (
             <SidebarMenuItem key={item.label}>
             <Link href={item.href} className="block w-full">
               <SidebarMenuButton
                 isActive={pathname === item.href}
                 tooltip={item.label}
               >
                 <item.icon />
                 <span>{item.label}</span>
               </SidebarMenuButton>
             </Link>
           </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}
