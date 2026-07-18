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
      <div className="min-h-screen flex items-center justify-center bg-transparent text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row text-foreground">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 backdrop-blur-3xl flex flex-col shadow-2xl relative z-30">
        <Link href="/" className="p-6 flex items-center gap-3 group cursor-pointer transition-all hover:scale-[1.02]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.3)] group-hover:shadow-[0_0_30px_rgba(0,112,243,0.5)] transition-all border border-white/10">
            <span className="font-bold text-white text-lg tracking-tighter">Q</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-xl text-foreground">QueueOS</span>
            <div className="px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-[0_0_10px_rgba(0,112,243,0.2)]">
              Beta
            </div>
          </div>
        </Link>
        
        <div className="px-4 py-2 relative z-50">
          <GlobalSearch />
        </div>
        
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-3">Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link key={item.name} href={item.href} className="relative block group">
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-white/5 rounded-xl border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.03)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
                <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors z-10 ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  <item.icon className={`w-4 h-4 transition-colors ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(0,112,243,0.5)]' : 'group-hover:text-foreground'}`} />
                  <span className="text-sm">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.02] mb-3 border border-white/5 transition-all hover:bg-white/[0.04] cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center text-zinc-300 font-medium border border-white/10 shadow-inner">
              {manager.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{manager.name}</p>
              <p className="text-xs text-muted-foreground truncate">{manager.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm h-9 rounded-xl transition-all" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative z-20">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 lg:px-10 shrink-0 sticky top-0 bg-black/10 backdrop-blur-xl z-20">
          <div className="flex items-center text-sm text-muted-foreground font-medium gap-2">
            <Link href="/dashboard" className="hover:text-foreground cursor-pointer transition-colors">QueueOS</Link>
            <span className="text-border">/</span>
            <span className="text-foreground">{navItems.find(i => pathname.startsWith(i.href) && i.href !== '/dashboard' || (pathname === '/dashboard' && i.href === '/dashboard'))?.name || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-white/[0.02] border border-white/5 px-2.5 py-1.5 rounded-lg shadow-sm">
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
              initial={{ opacity: 0, y: 15, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -15, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
