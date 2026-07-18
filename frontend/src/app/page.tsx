'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden z-10">
      
      <header className="flex justify-between items-center p-6 lg:px-12 relative z-50">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-3 glass-panel px-5 py-2.5 rounded-2xl border-white/5"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            Q
          </div>
          <span className="font-semibold text-xl tracking-tight text-foreground drop-shadow-sm">QueueOS</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 glass-panel px-4 py-2 rounded-2xl border-white/5"
        >
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2">
            Sign In
          </Link>
          <Link href="/register">
            <Button className="luxury-button rounded-xl h-9 px-5">
              Get Started
            </Button>
          </Link>
        </motion.div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-white/10 text-sm text-muted-foreground mb-8 shadow-2xl"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent font-medium">QueueOS 1.0 is now live</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-br from-white via-white to-white/40 bg-clip-text text-transparent max-w-5xl leading-[1.1] drop-shadow-2xl"
        >
          Intelligent queue management for modern teams.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed font-light"
        >
          Streamline customer flow, gain operational insights, and deliver exceptional service with our enterprise-grade platform.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md mx-auto"
        >
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full luxury-button rounded-2xl h-14 px-8 text-base shadow-[0_0_40px_rgba(255,255,255,0.1)] group">
              Start for free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full rounded-2xl h-14 px-8 border-white/10 bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-md text-foreground font-medium transition-all hover:scale-[1.02]">
              View Live Demo
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
