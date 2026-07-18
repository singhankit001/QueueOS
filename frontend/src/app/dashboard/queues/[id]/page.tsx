'use client';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Plus, X, Users, Clock, Loader2, ArrowLeft, GripVertical, CheckCircle2 } from 'lucide-react';
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
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-zinc-500 font-medium">Loading queue workspace...</p>
        </div>
      </div>
    );
  }

  if (!queue) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 border border-zinc-800">
          <X className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold">Queue Not Found</h2>
        <p className="text-zinc-500 mt-2">This queue may have been deleted or you don&apos;t have access.</p>
        <Button onClick={() => router.push('/dashboard/queues')} className="mt-6">Return to Queues</Button>
      </div>
    );
  }

  const nowServing = localTokens[0];
  const nextUp = localTokens[1];
  const waitingQueue = localTokens.slice(2);

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/queues')} className="text-zinc-400 hover:text-white hover:bg-zinc-900 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-100">{queue.name}</h1>
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 Live
              </div>
            </div>
            <p className="text-zinc-500 mt-1">{queue.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setOpen(true)} className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-white gap-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Add Token
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white shadow-2xl">
              <DialogHeader>
                <DialogTitle>Issue New Token</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  Add a new person to the queue.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit((data) => addToken.mutate(data))} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input {...register('personName')} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" autoFocus />
                  {errors.personName && <p className="text-sm text-red-500">{errors.personName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Phone (Optional)</Label>
                  <Input {...register('phone')} className="bg-zinc-900 border-zinc-800 focus-visible:ring-indigo-500" />
                </div>
                <Button type="submit" disabled={addToken.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                  {addToken.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Issue Token'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button 
            onClick={() => serveNext.mutate()} 
            disabled={localTokens.length === 0 || serveNext.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] gap-2 h-10 px-6 font-medium transition-all"
          >
            {serveNext.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Serve Next
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Waiting</p>
            <p className="text-2xl font-bold text-zinc-100">{localTokens.length}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Served Today</p>
            <p className="text-2xl font-bold text-zinc-100">{queue.metrics?.totalServed || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Avg Wait</p>
            <p className="text-2xl font-bold text-zinc-100">{Math.floor((queue.metrics?.averageWaitTime || 0) / 60)}<span className="text-sm text-zinc-500 ml-1">min</span></p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="space-y-12">
        
        {/* Now Serving & Next Up */}
        {(nowServing || nextUp) && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Now Serving Card */}
            {nowServing && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Now Serving
                </h3>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={nowServing.id}
                  className="bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 border border-emerald-500/30 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)] relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-emerald-500/80 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        Token {nowServing.tokenNumber}
                      </span>
                      <h2 className="text-3xl font-bold text-zinc-100 mt-4 tracking-tight">{nowServing.personName}</h2>
                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for {Math.floor((new Date().getTime() - new Date(nowServing.createdAt).getTime()) / 60000)}m</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity border-red-500/20 hover:bg-red-500/10 hover:text-red-400 text-zinc-500"
                      onClick={() => cancelToken.mutate(nowServing.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Next Up Card */}
            {nextUp && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Next Up
                </h3>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={nextUp.id}
                  className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 shadow-xl relative group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-zinc-400 bg-zinc-800/50 px-2.5 py-1 rounded-full">
                        Token {nextUp.tokenNumber}
                      </span>
                      <h2 className="text-2xl font-bold text-zinc-200 mt-4">{nextUp.personName}</h2>
                      <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
                        <Clock className="w-4 h-4" />
                        <span>Waiting for {Math.floor((new Date().getTime() - new Date(nextUp.createdAt).getTime()) / 60000)}m</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity border-red-500/20 hover:bg-red-500/10 hover:text-red-400 text-zinc-500"
                      onClick={() => cancelToken.mutate(nextUp.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>
        )}

        {/* Drag and Drop Waiting Queue */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-3">
            Waiting Queue <span className="ml-2 bg-zinc-900 text-zinc-400 py-0.5 px-2 rounded-full text-xs">{waitingQueue.length}</span>
          </h3>
          
          {waitingQueue.length === 0 && !nowServing && !nextUp ? (
            <div className="flex flex-col items-center justify-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
              <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <Users className="w-8 h-8 text-zinc-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-300">No one is waiting</h3>
              <p className="text-zinc-500 mt-1 max-w-sm text-center">Your queue is empty. Issue a token to get started.</p>
              <Button onClick={() => setOpen(true)} className="mt-6 bg-white text-black hover:bg-zinc-200">
                <Plus className="w-4 h-4 mr-2" /> Issue First Token
              </Button>
            </div>
          ) : waitingQueue.length === 0 ? (
            <div className="py-8 text-center text-zinc-600 text-sm italic">
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileDrag={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)", zIndex: 50, cursor: "grabbing" }}
                      className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between group hover:bg-zinc-900/60 transition-colors relative cursor-grab"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-zinc-950 flex flex-col items-center justify-center border border-zinc-800 shadow-inner shrink-0 cursor-grab text-zinc-500 hover:text-zinc-300 transition-colors">
                          <GripVertical className="w-5 h-5 opacity-50 group-hover:opacity-100" />
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-zinc-200">{token.personName}</h3>
                            <span className="text-zinc-500 text-sm font-medium">#{token.tokenNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pos {globalIndex + 1}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span>Joined {new Date(token.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="hover:bg-red-500/10 hover:text-red-400 text-zinc-500 transition-colors"
                          onClick={() => cancelToken.mutate(token.id)}
                        >
                          <X className="w-4 h-4" />
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
