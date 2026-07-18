'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Plus, X, Users, Clock, Loader2, ArrowLeft, GripVertical, CheckCircle2, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

interface Token {
  id: string;
  tokenNumber: string;
  personName: string;
  status: string;
  createdAt: string;
}

const tokenSchema = z.object({
  personName: z.string().min(2, "Name is required"),
  phone: z.string().optional()
});

export default function LiveQueuePage() {
  const { id } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [localTokens, setLocalTokens] = useState<Token[]>([]);

  // Fetch Queue Data
  const { data: queue, isLoading } = useQuery({
    queryKey: ['queue', id],
    queryFn: async () => {
      const res = await api.get(`/queues/${id}`);
      return res.data.data;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (queue) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalTokens(queue.tokens || []);
    }
  }, [queue]);

  // Socket.io integration
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '') 
      : 'http://localhost:5001';
    const socket = io(socketUrl, { withCredentials: true });
    
    socket.on('connect', () => {
      socket.emit('join-queue', id);
    });

    socket.on('queue-updated', (data) => {
      queryClient.invalidateQueries({ queryKey: ['queue', id] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      
      if (data?.type === 'SERVE_NEXT') {
        toast.info(`Serving ${data.token.tokenNumber}`, {
          description: data.token.personName
        });
      }
    });

    return () => {
      socket.emit('leave-queue', id);
      socket.disconnect();
    };
  }, [id, queryClient]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof tokenSchema>>({
    resolver: zodResolver(tokenSchema)
  });

  const addToken = useMutation({
    mutationFn: async (data: z.infer<typeof tokenSchema>) => {
      const res = await api.post(`/queues/${id}/tokens`, data);
      return res.data;
    },
    onSuccess: () => {
      setOpen(false);
      reset();
      toast.success("Token generated successfully");
    }
  });

  const serveNext = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/queues/${id}/serve-next`);
      return res.data;
    }
  });

  const moveUp = useMutation({
    mutationFn: async (tokenId: string) => {
      await api.patch(`/tokens/${tokenId}/move-up`);
    }
  });

  const moveDown = useMutation({
    mutationFn: async (tokenId: string) => {
      await api.patch(`/tokens/${tokenId}/move-down`);
    }
  });

  const cancelToken = useMutation({
    mutationFn: async (tokenId: string) => {
      await api.patch(`/tokens/${tokenId}/cancel`);
    },
    onSuccess: () => toast.success("Token cancelled")
  });

  const handleReorder = async (newOrder: Token[]) => {
    // Find the item that moved
    const movedItemIndex = newOrder.findIndex((t, i) => t.id !== localTokens[i]?.id);
    if (movedItemIndex === -1) return;
    
    const oldIndex = localTokens.findIndex(t => t.id === newOrder[movedItemIndex].id);
    const tokenId = newOrder[movedItemIndex].id;
    
    // Optimistic UI Update
    setLocalTokens(newOrder);
    
    // Sequential API calls to resolve difference
    try {
      if (movedItemIndex < oldIndex) {
        // Moved Up
        const steps = oldIndex - movedItemIndex;
        for (let i = 0; i < steps; i++) {
          await moveUp.mutateAsync(tokenId);
        }
      } else {
        // Moved Down
        const steps = movedItemIndex - oldIndex;
        for (let i = 0; i < steps; i++) {
          await moveDown.mutateAsync(tokenId);
        }
      }
    } catch (e) {
      toast.error("Failed to reorder completely. Resyncing.");
      queryClient.invalidateQueries({ queryKey: ['queue', id] });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading command center...</p>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center mb-4 shadow-xl">
          <X className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Queue Not Found</h2>
        <p className="text-muted-foreground mt-2">This queue may have been deleted or you don&apos;t have access.</p>
        <Button onClick={() => router.push('/dashboard/queues')} className="mt-6 luxury-button">Return to Queues</Button>
      </div>
    );
  }

  const nowServing = localTokens[0];
  const nextUp = localTokens[1];
  const waitingQueue = localTokens.slice(2);

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto relative z-10">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/queues')} className="text-muted-foreground hover:text-foreground hover:bg-white/[0.05] rounded-xl shrink-0 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm">{queue.name}</h1>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                 Live
              </div>
            </div>
            <p className="text-muted-foreground mt-1 text-lg">{queue.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setOpen(true)} className="border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-foreground gap-2 h-12 px-6 rounded-xl shadow-sm transition-all hover:scale-[1.02]">
            <Plus className="w-5 h-5" />
            Issue Token
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-black/60 backdrop-blur-2xl border-white/10 text-foreground shadow-2xl rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Issue New Token</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new person to the queue.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => addToken.mutate(data))} className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="ml-1 text-zinc-300">Name</Label>
                  <Input {...register('personName')} className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-12 rounded-xl" autoFocus />
                  {errors.personName && <p className="text-sm text-destructive ml-1">{errors.personName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="ml-1 text-zinc-300">Phone (Optional)</Label>
                  <Input {...register('phone')} className="bg-black/40 border-white/10 focus-visible:ring-primary focus-visible:border-primary text-white h-12 rounded-xl" />
                </div>
                <div className="pt-2">
                  <Button type="submit" disabled={addToken.isPending} className="w-full h-12 bg-foreground text-background font-semibold rounded-xl luxury-button transition-all">
                    {addToken.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Issue Token'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={() => serveNext.mutate()} 
            disabled={localTokens.length === 0 || serveNext.isPending}
            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] gap-2 h-12 px-8 font-semibold rounded-xl transition-all hover:-translate-y-0.5 border border-emerald-400/20 disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
          >
            {serveNext.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Serve Next
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-card p-5 md:p-6 rounded-3xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -inset-px opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.2), transparent 70%)' }} />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">Waiting</p>
            <p className="text-3xl font-bold text-foreground drop-shadow-sm">{localTokens.length}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner relative z-10">
            <Users className="w-6 h-6 drop-shadow-md" />
          </div>
        </div>
        <div className="glass-card p-5 md:p-6 rounded-3xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -inset-px opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(16,185,129,0.2), transparent 70%)' }} />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">Served Today</p>
            <p className="text-3xl font-bold text-foreground drop-shadow-sm">{queue.metrics?.totalServed || 0}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner relative z-10">
            <CheckCircle2 className="w-6 h-6 drop-shadow-md" />
          </div>
        </div>
        <div className="glass-card p-5 md:p-6 rounded-3xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute -inset-px opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.2), transparent 70%)' }} />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest mb-2">Avg Wait</p>
            <p className="text-3xl font-bold text-foreground drop-shadow-sm">{Math.floor((queue.metrics?.averageWaitTime || 0) / 60)}<span className="text-base text-muted-foreground ml-1">min</span></p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shadow-inner relative z-10">
            <Clock className="w-6 h-6 drop-shadow-md" />
          </div>
        </div>
      </div>

      <div className="space-y-12">
        
        {/* Now Serving & Next Up */}
        {(nowServing || nextUp) && (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Now Serving Card */}
            {nowServing && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  Now Serving
                </h3>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={nowServing.id}
                  className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-8 shadow-[0_15px_40px_rgba(16,185,129,0.15)] relative overflow-hidden group backdrop-blur-2xl"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 bg-[length:200%_100%] animate-pulse" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/40 via-transparent to-transparent opacity-50" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-xs font-semibold text-emerald-200 bg-emerald-500/20 px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-inner drop-shadow-md">
                        Token {nowServing.tokenNumber}
                      </span>
                      <h2 className="text-4xl font-bold text-foreground mt-5 tracking-tight drop-shadow-sm">{nowServing.personName}</h2>
                      <div className="flex items-center gap-2 mt-3 text-sm text-emerald-100/70">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for {Math.floor((new Date().getTime() - new Date(nowServing.createdAt).getTime()) / 60000)}m</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 text-red-400/70"
                      onClick={() => cancelToken.mutate(nowServing.id)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Next Up Card */}
            {nextUp && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-widest flex items-center gap-2 drop-shadow-[0_0_8px_rgba(0,112,243,0.5)]">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(0,112,243,0.8)]" />
                  Next Up
                </h3>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={nextUp.id}
                  className="glass-panel border-primary/20 rounded-3xl p-8 shadow-[0_15px_40px_rgba(0,112,243,0.1)] relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 shadow-inner drop-shadow-sm">
                        Token {nextUp.tokenNumber}
                      </span>
                      <h2 className="text-3xl font-bold text-foreground mt-5 tracking-tight drop-shadow-sm">{nextUp.personName}</h2>
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for {Math.floor((new Date().getTime() - new Date(nextUp.createdAt).getTime()) / 60000)}m</span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-10 h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 text-red-400/70"
                      onClick={() => cancelToken.mutate(nextUp.id)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Drag and Drop Waiting Queue */}
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-3">
            Waiting Queue 
            <span className="bg-white/10 text-foreground py-0.5 px-2.5 rounded-full text-xs font-bold border border-white/10 shadow-inner">
              {waitingQueue.length}
            </span>
          </h3>
          
          {waitingQueue.length === 0 && !nowServing && !nextUp ? (
            <div className="flex flex-col items-center justify-center py-28 glass-panel border-dashed border-white/10 rounded-[40px]">
              <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/5">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground drop-shadow-sm">No one is waiting</h3>
              <p className="text-muted-foreground mt-2 max-w-sm text-center text-lg">Your queue is empty. Issue a token to get started.</p>
              <Button onClick={() => setOpen(true)} className="mt-8 h-12 px-8 bg-foreground text-background font-semibold rounded-xl luxury-button transition-all">
                <Plus className="w-5 h-5 mr-2" /> Issue First Token
              </Button>
            </div>
          ) : waitingQueue.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm font-medium italic glass-panel rounded-3xl border-dashed border-white/10">
              No additional customers waiting.
            </div>
          ) : (
            <Reorder.Group axis="y" values={localTokens} onReorder={handleReorder} className="space-y-3">
              <AnimatePresence mode="popLayout">
                {waitingQueue.map((token: Token, index: number) => {
                  const globalIndex = index + 2; // offset for nowServing and nextUp
                  return (
                    <Reorder.Item 
                      key={token.id} 
                      value={token}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
                      whileDrag={{ scale: 1.02, boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)", zIndex: 50, cursor: "grabbing" }}
                      className="glass-panel border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.04] transition-colors relative cursor-grab"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-black/40 flex flex-col items-center justify-center border border-white/5 shadow-inner shrink-0 cursor-grab text-muted-foreground hover:text-foreground transition-colors">
                          <GripVertical className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-foreground drop-shadow-sm">{token.personName}</h3>
                            <span className="text-muted-foreground text-sm font-medium">#{token.tokenNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pos {globalIndex + 1}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span>Joined {new Date(token.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-10 h-10 rounded-full border border-red-500/0 hover:border-red-500/20 bg-transparent hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-all"
                          onClick={() => cancelToken.mutate(token.id)}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>
                    </Reorder.Item>
                  )
                })}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>
      </div>
    </div>
  );
}
