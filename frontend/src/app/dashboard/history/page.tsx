'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { CheckCircle2, XCircle, Clock, Users, Loader2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function HistoryPage() {
  const [search, setSearch] = useState('');

  const { data: queues, isLoading } = useQuery({
    queryKey: ['queues-history'],
    queryFn: async () => {
      const res = await api.get('/queues?includeAll=true');
      return res.data.data;
    }
  });

  // Fetch all tokens across all queues (served + cancelled)
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    }
  });

  if (isLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading history...</p>
        </div>
      </div>
    );
  }

  const recentActivity = historyData?.recentActivity || [];

  const filteredActivity = recentActivity.filter((activity: { personName?: string; tokenNumber?: string; queueName: string }) =>
    (activity.personName || '').toLowerCase().includes(search.toLowerCase()) ||
    (activity.tokenNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (activity.queueName || '').toLowerCase().includes(search.toLowerCase())
  );

  const cancelledCount = recentActivity?.filter((t: { status: string }) => t.status === 'CANCELLED').length || 0;
  const servedCount = recentActivity?.filter((t: { status: string }) => t.status === 'COMPLETED').length || 0;
  const waitingCount = recentActivity?.filter((t: { status: string }) => t.status === 'WAITING').length || 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 relative z-10"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">History</h1>
        <p className="text-muted-foreground mt-2">Review recent token activity across all queues.</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500 text-emerald-500">
            <CheckCircle2 className="w-24 h-24" />
          </div>
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Served</h3>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground drop-shadow-sm">{historyData?.tokensServedToday || 0}</div>
          <p className="text-xs text-emerald-400 mt-2 font-medium">Successfully completed</p>
        </div>

        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500 text-rose-500">
            <XCircle className="w-24 h-24" />
          </div>
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Cancelled</h3>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-inner">
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground drop-shadow-sm">{cancelledCount}</div>
          <p className="text-xs text-rose-400 mt-2 font-medium">Dropped or cancelled</p>
        </div>

        <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500 text-indigo-500">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
          </div>
          <div className="text-4xl font-bold text-foreground drop-shadow-sm">{historyData?.activeQueueLength || 0}</div>
          <p className="text-xs text-indigo-400 mt-2 font-medium">Currently waiting</p>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div variants={itemVariants} className="glass-panel rounded-3xl overflow-hidden border-white/5 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground drop-shadow-sm flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h2>
          <div className="relative group w-full sm:w-72">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
            <Input
              placeholder="Search by name, token or queue..."
              className="relative pl-9 bg-black/40 border-white/10 focus-visible:ring-0 focus-visible:border-transparent text-white h-10 rounded-xl transition-all w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0">
          {filteredActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 text-white/10" />
              <p className="font-medium text-lg">No activity found</p>
              <p className="text-sm mt-1">Token activity will appear here as customers are served.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 px-6 py-4 text-xs text-muted-foreground font-semibold uppercase tracking-wider bg-white/[0.02]">
                <span>Token</span>
                <span>Customer</span>
                <span>Queue</span>
                <span>Status</span>
                <span className="text-right">Time</span>
              </div>

              <AnimatePresence>
                {filteredActivity.map((activity: { id: string; eventType: string; description: string; queueName: string; createdAt: string; status?: string; tokenNumber?: string; personName?: string; timestamp?: string }, index: number) => {
                  const isServed = activity.status === 'COMPLETED';
                  const isCancelled = activity.status === 'CANCELLED';

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-white/[0.02] transition-colors group"
                    >
                      <span className="text-sm font-mono text-primary font-bold">
                        <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/5 group-hover:bg-primary/20 transition-colors">
                          {activity.tokenNumber}
                        </span>
                      </span>
                      <span className="text-sm text-foreground font-medium truncate drop-shadow-sm">{activity.personName}</span>
                      <span className="text-sm text-muted-foreground truncate">{activity.queueName}</span>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-inner ${
                          isServed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : isCancelled
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                        }`}>
                          {isServed ? <CheckCircle2 className="w-3 h-3" /> : isCancelled ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isServed ? 'Served' : isCancelled ? 'Cancelled' : 'Waiting'}
                        </span>
                      </div>
                      <time className="text-xs text-muted-foreground font-mono text-right">
                        {new Date((activity.timestamp || activity.createdAt) as string).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </time>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
