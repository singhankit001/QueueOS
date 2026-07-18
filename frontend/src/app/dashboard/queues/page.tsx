'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Users, ArrowRight, Loader2, ListTree } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

const queueSchema = z.object({
  name: z.string().min(2, "Queue name is required"),
  description: z.string().optional()
});

export default function QueuesPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: queues, isLoading } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => {
      const res = await api.get('/queues');
      return res.data.data;
    }
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof queueSchema>>({
    resolver: zodResolver(queueSchema)
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof queueSchema>) => {
      const res = await api.post('/queues', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      setOpen(false);
      reset();
      toast.success("Queue created successfully");
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to create queue");
    }
  });

  const onSubmit = (data: z.infer<typeof queueSchema>) => {
    createMutation.mutate(data);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">Queues</h1>
          <p className="text-muted-foreground mt-2">Manage your service queues and customer flow.</p>
        </div>
        
        <Button onClick={() => setOpen(true)} className="luxury-button rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Create Queue
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-black/60 backdrop-blur-2xl border-white/10 text-foreground shadow-2xl rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create new queue</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Set up a new queue to start managing customers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300 ml-1">Queue Name</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <Input 
                    id="name" 
                    placeholder="e.g., Customer Support" 
                    {...register('name')} 
                    className="relative bg-black/40 border-white/10 focus-visible:ring-0 focus-visible:border-transparent text-white h-12 rounded-xl transition-all"
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive ml-1">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-300 ml-1">Description (Optional)</Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
                  <Input 
                    id="description" 
                    placeholder="e.g., General inquiries and support" 
                    {...register('description')} 
                    className="relative bg-black/40 border-white/10 focus-visible:ring-0 focus-visible:border-transparent text-white h-12 rounded-xl transition-all"
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={createMutation.isPending} className="w-full luxury-button rounded-xl h-12">
                  {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Queue'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : queues?.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-28 glass-panel border-dashed border-white/10 rounded-[40px]"
        >
          <div className="w-20 h-20 bg-white/[0.03] rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/5">
            <ListTree className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground drop-shadow-sm mb-2">No queues found</h3>
          <p className="text-muted-foreground max-w-sm text-center mb-8 text-lg">You haven&apos;t created any queues yet. Create your first queue to start managing customers.</p>
          <Button onClick={() => setOpen(true)} className="h-12 px-8 luxury-button rounded-xl shadow-lg">
            Create your first queue
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {queues?.map((queue: { id: string; name: string; description?: string; _count: { tokens: number } }) => (
            <motion.div variants={itemVariants} key={queue.id}>
              <Link href={`/dashboard/queues/${queue.id}`} className="block h-full group">
                <div className="glass-card rounded-3xl p-6 h-full flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] border-white/5 hover:border-primary/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground drop-shadow-sm group-hover:text-primary transition-colors">{queue.name}</h3>
                        <p className="text-muted-foreground mt-1 text-sm line-clamp-2">
                          {queue.description || "No description"}
                        </p>
                      </div>
                      <div className="shrink-0 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border border-primary/20 shadow-inner group-hover:bg-primary/20 transition-colors">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                        {queue._count.tokens} Waiting
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Manage Queue
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
