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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
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
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Analytics Overview</h1>
        <p className="text-zinc-500 mt-2">Monitor your queue performance and customer flow.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Active Waiting" value={data?.activeQueueLength || 0} icon={Users} color="text-indigo-400" bg="bg-indigo-500/10" border="border-indigo-500/20" />
        <StatCard title="Avg Wait Time" value={`${Math.floor((data?.averageWaitTime || 0) / 60)}m ${(data?.averageWaitTime || 0) % 60}s`} icon={Clock} color="text-violet-400" bg="bg-violet-500/10" border="border-violet-500/20" />
        <StatCard title="Tokens Served" value={data?.tokensServedToday || 0} icon={CheckCircle2} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
        <StatCard title="Cancellation Rate" value={`${(data?.cancellationRate || 0).toFixed(1)}%`} icon={XCircle} color="text-rose-400" bg="bg-rose-500/10" border="border-rose-500/20" />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <Card className="bg-zinc-950/50 border-zinc-900 shadow-xl overflow-hidden backdrop-blur-xl">
            <CardHeader className="border-b border-zinc-900/50 bg-zinc-950/80">
              <CardTitle className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Wait Time Trend
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] p-0 pt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.chartData?.waitTrend || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWait" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    itemStyle={{ color: '#f4f4f5', fontWeight: 500 }}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                    cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="avgWaitTime" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorWait)" activeDot={{ r: 6, fill: '#6366f1', stroke: '#000', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="xl:col-span-1">
          <Card className="bg-zinc-950/50 border-zinc-900 shadow-xl backdrop-blur-xl h-full flex flex-col">
            <CardHeader className="border-b border-zinc-900/50 bg-zinc-950/80">
              <CardTitle className="text-lg font-medium text-zinc-100 flex items-center justify-between">
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-y-auto max-h-[350px]">
              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-6 relative">
                  <div className="absolute top-0 bottom-0 left-[27px] w-px bg-zinc-800/50" />
                  {(data?.recentActivity || []).map((activity: { id: string; eventType: string; description: string; createdAt: string; queue: { name: string }; status?: string; tokenNumber?: string; timestamp?: string; personName?: string; queueName?: string }) => {
                    const isServed = activity.status === 'COMPLETED';
                    const isCancelled = activity.status === 'CANCELLED';
                    
                    return (
                      <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-black shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${
                          isServed ? 'bg-emerald-500/20 text-emerald-400' :
                          isCancelled ? 'bg-rose-500/20 text-rose-400' :
                          'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {isServed ? <CheckCircle2 className="w-4 h-4" /> : isCancelled ? <XCircle className="w-4 h-4" /> : <PlusIcon />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 shadow-sm transition-all hover:bg-zinc-900">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-zinc-200 text-sm">{activity.tokenNumber}</div>
                            <div className="text-xs text-zinc-500 whitespace-nowrap">{format(new Date((activity.timestamp || activity.createdAt) as string), "h:mm a")}</div>
                          </div>
                          <div className="text-sm text-zinc-400">
                            {activity.personName} {isServed ? 'was served in' : isCancelled ? 'was cancelled in' : 'joined'} <span className="text-zinc-300 font-medium">{activity.queueName}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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

function StatCard({ title, value, icon: Icon, color, bg, border }: { title: string, value: string | number, icon: React.ElementType, color: string, bg: string, border: string }) {
  return (
    <Card className="bg-zinc-950/50 border-zinc-900 backdrop-blur-xl relative overflow-hidden group">
      <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
            <motion.h3 
              className="text-3xl font-bold text-zinc-100"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {value}
            </motion.h3>
          </div>
          <div className={`p-3 rounded-2xl border ${bg} ${border} ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
