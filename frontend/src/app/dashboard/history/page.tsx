'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Users, Loader2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
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
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-zinc-500 font-medium">Loading history...</p>
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
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">History</h1>
        <p className="text-zinc-500 mt-2">Review recent token activity across all queues.</p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Served</p>
            <p className="text-2xl font-bold text-emerald-400">{historyData?.tokensServedToday || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-rose-400">{cancelledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Active</p>
            <p className="text-2xl font-bold text-indigo-400">{historyData?.activeQueueLength || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="Search by name, token, or queue..."
          className="bg-zinc-900/50 border-zinc-800 pl-10 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </motion.div>

      {/* Activity Table */}
      <motion.div variants={itemVariants}>
        <Card className="bg-zinc-950/50 border-zinc-900 shadow-xl overflow-hidden backdrop-blur-xl">
          <CardHeader className="border-b border-zinc-900/50 bg-zinc-950/80">
            <CardTitle className="text-lg font-medium text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <Users className="w-8 h-8 mb-3 text-zinc-600" />
                <p className="font-medium">No activity found</p>
                <p className="text-sm mt-1">Token activity will appear here as customers are served.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-900/50">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 px-6 py-3 text-xs text-zinc-500 font-semibold uppercase tracking-wider bg-zinc-950/50">
                  <span>Token</span>
                  <span>Customer</span>
                  <span>Queue</span>
                  <span>Status</span>
                  <span className="text-right">Time</span>
                </div>

                {filteredActivity.map((activity: { id: string; eventType: string; description: string; queueName: string; createdAt: string; status?: string; tokenNumber?: string; personName?: string; timestamp?: string }, index: number) => {
                  const isServed = activity.status === 'COMPLETED';
                  const isCancelled = activity.status === 'CANCELLED';

                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="grid grid-cols-5 gap-4 px-6 py-4 items-center hover:bg-zinc-900/30 transition-colors group"
                    >
                      <span className="text-sm font-mono text-indigo-400 font-medium">{activity.tokenNumber}</span>
                      <span className="text-sm text-zinc-200 font-medium truncate">{activity.personName}</span>
                      <span className="text-sm text-zinc-400 truncate">{activity.queueName}</span>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          isServed
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isCancelled
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {isServed ? <CheckCircle2 className="w-3 h-3" /> : isCancelled ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {isServed ? 'Served' : isCancelled ? 'Cancelled' : 'Waiting'}
                        </span>
                      </div>
                      <time className="text-xs text-zinc-500 font-mono text-right">
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
