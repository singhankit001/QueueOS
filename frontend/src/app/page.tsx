import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/20 blur-[120px]" />
      
      <header className="flex justify-between items-center p-6 lg:px-12 relative z-10 border-b border-zinc-800/50 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            Q
          </div>
          <span className="font-semibold text-xl tracking-tight">QueueOS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-200 font-medium rounded-full px-6">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-400 mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          QueueOS 1.0 is now live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent max-w-4xl">
          Intelligent queue management for modern teams.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Streamline customer flow, gain operational insights, and deliver exceptional service with our enterprise-grade platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mx-auto">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-white text-zinc-950 hover:bg-zinc-200 rounded-full h-12 px-8 font-medium shadow-xl shadow-white/5">
              Start for free
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full rounded-full h-12 px-8 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 backdrop-blur-md text-white">
              Sign in
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
