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
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore(state => state.setAuth);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setLoading(true);
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        setAuth(res.data.data.manager);
        toast.success('Account created successfully!');
        router.push('/dashboard');
      }
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key="register-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative"
        >
          {/* Decorative glowing orb behind the card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-br from-primary/20 via-violet-500/20 to-transparent rounded-full blur-[80px] -z-10 animate-pulse" style={{ animationDuration: '4s' }} />
          
          <div className="glass-panel border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden backdrop-blur-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
            
            <div className="p-8 relative z-10">
              <div className="text-center mb-8">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  className="w-14 h-14 bg-gradient-to-br from-primary to-violet-600 rounded-2xl flex items-center justify-center font-bold text-white text-2xl mx-auto mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                >
                  Q
                </motion.div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">Create an account</h1>
                <p className="text-muted-foreground mt-2 font-medium">
                  Sign up to start managing your queues
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-zinc-300 ml-1">Full Name</Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      {...register('name')}
                      className="relative bg-black/40 border-white/10 focus-visible:ring-0 focus-visible:border-transparent text-white h-12 rounded-xl transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-sm text-destructive ml-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300 ml-1">Email</Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="m@example.com" 
                      {...register('email')}
                      className="relative bg-black/40 border-white/10 focus-visible:ring-0 focus-visible:border-transparent text-white h-12 rounded-xl transition-all"
                    />
                  </div>
                  {errors.email && <p className="text-sm text-destructive ml-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300 ml-1">Password</Label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••"
                      {...register('password')}
                      className="relative bg-black/40 border-white/10 focus-visible:ring-0 focus-visible:border-transparent text-white h-12 rounded-xl transition-all"
                    />
                  </div>
                  {errors.password && <p className="text-sm text-destructive ml-1">{errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full luxury-button rounded-xl h-12 text-base font-semibold mt-4" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create account'}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
