"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Landmark,
  Shield,
  Plus,
  Users,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WalletButton from "@/components/layout/WalletButton";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/treasury", label: "Treasury", icon: Landmark },
  { href: "/audit", label: "Audit Trail", icon: Shield },
  { href: "/founders", label: "Founders", icon: Users },
  { href: "/docs", label: "Docs", icon: BookOpen },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <Landmark className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Fund<span className="text-violet-400">Flow</span>{" "}
            <span className="text-sm font-normal text-gray-400">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href="/proposals/new"
            className="ml-2 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Proposal</span>
          </Link>
          <div className="ml-2">
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
