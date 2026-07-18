'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { LayoutDashboard, Users, LogOut, Loader2, History as HistoryIcon, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/GlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { manager, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    if (!manager) {
      router.push('/login');
    }
  }, [manager, router]);

  if (!isMounted || !manager) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-zinc-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Analytics', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Queues', href: '/dashboard/queues', icon: Users },
    { name: 'History', href: '/dashboard/history', icon: HistoryIcon },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row text-zinc-50 selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 bg-black flex flex-col">
        <Link href="/" className="p-6 flex items-center gap-3 group cursor-pointer transition-opacity hover:opacity-90">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-b from-indigo-500 to-indigo-600 flex items-center justify-center shadow-[0_2px_10px_rgba(99,102,241,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] group-hover:shadow-[0_4px_15px_rgba(99,102,241,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all border border-indigo-500/50">
            <span className="font-bold text-white text-lg tracking-tighter">Q</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-xl text-zinc-100">QueueOS</span>
            <div className="px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-sm">
              Beta
            </div>
          </div>
        </Link>
        
        <div className="px-4 py-2 relative z-50">
          <GlobalSearch />
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
          <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-2 px-3">Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link key={item.name} href={item.href} className="relative block">
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-zinc-900 rounded-lg border border-zinc-800/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors z-10 ${isActive ? 'text-zinc-100 font-medium' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : ''}`} />
                  <span className="text-sm">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-zinc-900/50 mb-3 border border-zinc-800/50 transition-colors hover:bg-zinc-900 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium border border-zinc-700">
              {manager.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-zinc-200 truncate">{manager.name}</p>
              <p className="text-xs text-zinc-500 truncate">{manager.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-sm h-9" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        {/* Header */}
        <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 bg-black/80 backdrop-blur-xl z-20">
          <div className="flex items-center text-sm text-zinc-500 font-medium gap-2">
            <Link href="/dashboard" className="hover:text-zinc-300 cursor-pointer transition-colors">QueueOS</Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200">{navItems.find(i => pathname.startsWith(i.href) && i.href !== '/dashboard' || (pathname === '/dashboard' && i.href === '/dashboard'))?.name || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 bg-zinc-900/50 border border-zinc-800 px-2 py-1 rounded-md">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>
        </header>

        {/* Page Content with AnimatePresence */}
        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 md:p-10 max-w-7xl mx-auto w-full min-h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
