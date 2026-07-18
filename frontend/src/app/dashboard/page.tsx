'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, CheckCircle2, XCircle, Activity, Loader2, ArrowRight, Hash } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

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

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const chartData = data?.chartData?.waitTrend || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 relative z-10"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground drop-shadow-sm">Command Center</h1>
        <p className="text-muted-foreground mt-2 text-lg">Real-time pulse of your operations.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Active Waiting" value={data?.activeQueueLength || 0} icon={Users} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" glowColor="rgba(59,130,246,0.5)" />
        <StatCard title="Avg Wait Time" value={`${Math.floor((data?.averageWaitTime || 0) / 60)}m ${(data?.averageWaitTime || 0) % 60}s`} icon={Clock} color="text-violet-400" bg="bg-violet-500/10" border="border-violet-500/20" glowColor="rgba(139,92,246,0.5)" />
        <StatCard title="Tokens Served" value={data?.tokensServedToday || 0} icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" glowColor="rgba(16,185,129,0.5)" />
        <StatCard title="Cancellation Rate" value={`${(data?.cancellationRate || 0).toFixed(1)}%`} icon={XCircle} color="text-rose-400" bg="bg-rose-500/10" border="border-rose-500/20" glowColor="rgba(244,63,94,0.5)" />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <div className="glass-panel rounded-3xl overflow-hidden h-full">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01]">
              <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(0,112,243,0.8)]" />
                Wait Time Trend
              </h2>
            </div>
            <div className="h-[350px] p-0 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="hour" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)' }}
                    itemStyle={{ color: '#fff', fontWeight: 500 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}
                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="avgWaitTime" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorWait)" activeDot={{ r: 6, fill: 'var(--primary)', stroke: '#000', strokeWidth: 2, className: 'drop-shadow-[0_0_8px_rgba(0,112,243,0.8)]' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-1">
          <div className="glass-panel rounded-3xl h-full flex flex-col">
            <div className="px-6 py-5 border-b border-white/5 bg-white/[0.01]">
              <h2 className="text-lg font-medium text-foreground flex items-center justify-between">
                Activity Pulse
              </h2>
            </div>
            <div className="flex-1 p-6 overflow-y-auto max-h-[350px] custom-scrollbar">
              {(!recentActivity || recentActivity.length === 0) ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-6 relative">
                  <div className="absolute top-0 bottom-0 left-[27px] w-px bg-white/5" />
                  {recentActivity.map((activity: { id: string; eventType: string; description: string; createdAt: string; queue: { name: string }; status?: string; tokenNumber?: string; timestamp?: string; personName?: string; queueName?: string }) => {
                    const isServed = activity.status === 'COMPLETED';
                    const isCancelled = activity.status === 'CANCELLED';
                    
                    return (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-black shrink-0 z-10 shadow-lg ${
                          isServed ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-emerald-500/20' :
                          isCancelled ? 'bg-rose-500/20 text-rose-400 border-rose-500/20 shadow-rose-500/20' :
                          'bg-primary/20 text-primary border-primary/20 shadow-primary/20'
                        }`}>
                          {isServed ? <CheckCircle2 className="w-4 h-4" /> : isCancelled ? <XCircle className="w-4 h-4" /> : <PlusIcon />}
                        </div>
                        <div className="w-[calc(100%-3.5rem)] ml-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 shadow-sm transition-all hover:bg-white/[0.04] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 duration-300">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-foreground text-sm">{activity.tokenNumber}</div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">{format(new Date((activity.timestamp || activity.createdAt) as string), "h:mm a")}</div>
                          </div>
                          <div className="text-sm text-zinc-400">
                            <span className="text-foreground">{activity.personName}</span> {isServed ? 'was served in' : isCancelled ? 'was cancelled in' : 'joined'} <span className="text-foreground font-medium">{activity.queueName}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  )
}

function StatCard({ title, value, icon: Icon, color, bg, border, glowColor }: { title: string, value: string | number, icon: any, color: string, bg: string, border: string, glowColor: string }) {
  return (
    <div className="glass-card rounded-3xl relative overflow-hidden group">
      <div 
        className="absolute -inset-px opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 z-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${glowColor}, transparent 60%)` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0`} />
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <motion.h3 
              className="text-3xl font-bold text-foreground tracking-tight drop-shadow-sm"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {value}
            </motion.h3>
          </div>
          <div className={`p-3.5 rounded-2xl border ${bg} ${border} ${color} shadow-inner`}>
            <Icon className="w-5 h-5 drop-shadow-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
