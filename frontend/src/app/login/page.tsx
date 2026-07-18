'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/login', data);
      if (res.data.success) {
        setAuth(res.data.data.manager);
        toast.success('Welcome back!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error;
      if (errorMsg) {
        toast.error(errorMsg);
      } else if (error.response?.status === 404) {
        toast.error("API Route not found. Check NEXT_PUBLIC_API_URL.");
      } else {
        toast.error("Network Error: Could not connect to the server.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Intense glow behind the card to emphasize depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#7928CA]/20 rounded-full blur-[80px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="glass-panel rounded-3xl p-8 md:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.4)]">
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-[#7928CA] flex items-center justify-center font-bold text-white text-2xl mx-auto mb-6 shadow-[0_0_30px_rgba(0,112,243,0.4)] border border-white/20"
            >
              Q
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Enter your credentials to access your command center.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300 ml-1">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@queueos.com" 
                {...register('email')}
                className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-12 rounded-xl transition-all shadow-inner"
              />
              {errors.email && <p className="text-sm text-destructive ml-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                {...register('password')}
                className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-12 rounded-xl transition-all shadow-inner"
              />
              {errors.password && <p className="text-sm text-destructive ml-1">{errors.password.message}</p>}
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-zinc-200 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] luxury-button" 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </Button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:text-white transition-colors font-medium drop-shadow-[0_0_8px_rgba(0,112,243,0.8)]">
                Request access
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
