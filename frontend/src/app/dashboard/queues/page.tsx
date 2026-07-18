'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Users, ArrowRight, Loader2 } from 'lucide-react';
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queues</h1>
          <p className="text-zinc-400 mt-2">Manage your service queues and customer flow.</p>
        </div>
        
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20">
          <Plus className="w-4 h-4" />
          Create Queue
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Create new queue</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Set up a new queue to start managing customers.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Queue Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Customer Support" 
                  {...register('name')} 
                  className="bg-zinc-900 border-zinc-800"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input 
                  id="description" 
                  placeholder="e.g., General inquiries and support" 
                  {...register('description')} 
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  {createMutation.isPending ? 'Creating...' : 'Create Queue'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : queues?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No queues found</h3>
          <p className="text-zinc-500 max-w-sm text-center mb-6">You haven&apos;t created any queues yet. Create your first queue to start managing customers.</p>
          <Button onClick={() => setOpen(true)} className="bg-white text-zinc-950 hover:bg-zinc-200">
            Create your first queue
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues?.map((queue: { id: string; name: string; description?: string; _count: { tokens: number } }) => (
            <Card key={queue.id} className="bg-zinc-900/50 border-zinc-800 backdrop-blur-md hover:border-zinc-700 transition-colors group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{queue.name}</CardTitle>
                    <CardDescription className="text-zinc-500 mt-1 line-clamp-1">
                      {queue.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-indigo-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    {queue._count.tokens} Waiting
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/dashboard/queues/${queue.id}`}>
                  <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white group-hover:bg-indigo-600 transition-colors">
                    Manage Queue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
