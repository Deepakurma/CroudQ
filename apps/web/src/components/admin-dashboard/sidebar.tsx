'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Building2,
  ChartNoAxesCombined,
  ChevronUp,
  Gem,
  HelpCircle,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquareText,
  Moon,
  Sun,
  UserRound
} from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/shared/shadcn/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '~/shared/shadcn/sidebar';

import { trpcClient } from '~/utils/trpc';

export default function AdminSidebar() {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const router = useRouter();

  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await trpcClient.auth.logout.mutate();
    } finally {
      router.replace('/auth?redirect=/admin/dashboard');
    }
  };

  const SidebarOptions: SidebarItemProps[] = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      active: pathname.startsWith('/admin/dashboard'),
      onClick: () => {
        router.push('/admin/dashboard');
      }
    },
    {
      icon: Building2,
      label: 'Vendors',
      active: pathname.startsWith('/admin/vendors'),
      onClick: () => {
        router.push('/admin/vendors');
      }
    },
    {
      icon: IndianRupee,
      label: 'Revenue',
      active: pathname.startsWith('/admin/revenue'),
      onClick: () => {
        router.push('/admin/revenue');
      }
    },
    {
      icon: ChartNoAxesCombined,
      label: 'MoM Analytics',
      active: pathname.startsWith('/admin/mom-analytics'),
      onClick: () => {
        router.push('/admin/mom-analytics');
      }
    },
    {
      icon: HelpCircle,
      label: 'Vendor Queries',
      active: pathname.startsWith('/admin/queries'),
      onClick: () => {
        router.push('/admin/queries');
      }
    },
    {
      icon: MessageSquareText,
      label: 'Feedbacks',
      active: pathname.startsWith('/admin/feedbacks'),
      onClick: () => {
        router.push('/admin/feedbacks');
      }
    },
    {
      icon: Gem,
      label: 'Promotions',
      active: pathname.startsWith('/admin/promotions'),
      onClick: () => {
        router.push('/admin/promotions');
      }
    },
    {
      icon: Megaphone,
      label: 'Announcement',
      active: pathname.startsWith('/admin/announcements'),
      onClick: () => {
        router.push('/admin/announcements');
      }
    }
  ];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="px-4 py-6">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1 transition-opacity hover:opacity-90">
          <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-xl transition-all hover:opacity-90 sm:size-12">
            <Image src="/assets/Logo.png" alt="Bunkezy Logo" fill className="object-cover" />
          </div>
          <div
            className={`flex flex-col transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <h1 className="text-foreground text-md font-bold tracking-tight sm:text-lg">Bunkezy</h1>
            <p className="text-muted-foreground text-[8px] font-medium tracking-wider whitespace-nowrap uppercase sm:text-[11px]">
              Admin Control
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {SidebarOptions.map((option) => (
              <SidebarItem
                key={option.label}
                icon={option.icon}
                label={option.label}
                active={option.active}
                onClick={option.onClick}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* ================= FOOTER ================= */}
      <SidebarFooter className="mb-3 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-1 overflow-hidden rounded-2xl px-2 py-1 shadow-sm transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                <Sun className="size-5 shrink-0 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute size-5 shrink-0 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              </div>

              <div
                className={`flex flex-col text-left transition-all duration-300 ${
                  isCollapsed ? 'invisible w-0 opacity-0' : 'visible w-auto opacity-100'
                }`}>
                <p className="line-clamp-1 text-sm leading-none font-medium">
                  {theme === 'system'
                    ? 'System theme'
                    : theme === 'dark'
                      ? 'Dark theme'
                      : 'Light theme'}
                </p>
              </div>

              <ChevronUp
                className={`ml-auto !h-5 !w-5 transition-all duration-300 ${
                  isCollapsed ? 'invisible w-0 opacity-0' : 'visible w-auto opacity-100'
                }`}
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-sidebar-accent hover:bg-sidebar-accent flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border p-2 transition-all group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 focus:outline-none">
              <div className="bg-card text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm">
                <UserRound size={20} />
              </div>

              <div
                className={`flex flex-col space-y-1.5 text-left transition-all duration-300 ${isCollapsed ? 'invisible w-0 opacity-0' : 'visible w-auto opacity-100'}`}>
                <p className="line-clamp-1 text-sm leading-none font-bold">Admin - account</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut size={16} />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, active, onClick }: SidebarItemProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={onClick}
        tooltip={label}
        className={`group relative flex w-full items-center rounded-xl px-3 py-6 ${
          active ? 'bg-primary/10 text-primary hover:primary/10 hover:text-primary' : ''
        }`}>
        <div className="flex items-center gap-3">
          <Icon
            size={20}
            className={`shrink-0 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
          />
          <span
            className={`text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${
              isCollapsed
                ? 'pointer-events-none translate-x-4 opacity-0'
                : 'translate-x-0 opacity-100'
            }`}>
            {label}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
