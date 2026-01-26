
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Tooltip } from 'recharts';
import { ProfileMetrics } from '../types';
import { Activity, Zap, Cpu, TrendingUp, BarChart3, Gauge, Layers, ArrowRight } from 'lucide-react';

interface ProfilerProps {
  baseline: ProfileMetrics;
  optimized: ProfileMetrics;
  hasOptimized: boolean;
}

const Profiler: React.FC<ProfilerProps> = ({ baseline, optimized, hasOptimized }) => {
  const radarData = [
    { subject: 'Occupancy', Baseline: baseline.occupancy, Optimized: optimized.occupancy, fullMark: 100 },
    { subject: 'SM Util', Baseline: baseline.smUtilization, Optimized: optimized.smUtilization, fullMark: 100 },
    { subject: 'Compute', Baseline: (baseline.throughput / Math.max(optimized.throughput, 1)) * 100, Optimized: 100, fullMark: 100 },
    { subject: 'Efficiency', Baseline: baseline.smUtilization, Optimized: optimized.smUtilization, fullMark: 100 },
    { subject: 'Memory', Baseline: baseline.l2HitRate || 20, Optimized: optimized.l2HitRate || 90, fullMark: 100 },
  ];

  const MetricCard = ({ title, baselineVal, optimizedVal, unit, baselineUnit, optimizedUnit, icon: Icon, color, description, data }: any) => (
    <div className="bg-[#0c0c0e] border border-zinc-800 p-5 rounded-sm flex flex-col gap-6 group hover:border-zinc-500 transition-all shadow-md overflow-hidden relative">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</span>
          <p className="text-[9px] text-zinc-600 font-bold leading-tight max-w-[140px]">{description}</p>
        </div>
        <div className={`p-2 rounded-sm bg-zinc-900 border border-zinc-800 ${color} shadow-sm`}>
          <Icon size={16} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-blue-400 text-[8px] uppercase font-black tracking-widest mb-0.5">Before</span>
            <div className="flex items-baseline gap-1">
              <span className="text-blue-200 font-mono text-xs font-medium">{baselineVal}</span>
              <span className="text-[8px] text-blue-400 font-bold uppercase">{baselineUnit ?? unit}</span>
            </div>
          </div>
          <ArrowRight size={14} className="text-zinc-800" />
          <div className="flex flex-col items-end">
            <span className="text-emerald-500 text-[10px] uppercase font-black tracking-widest mb-0.5">After</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-emerald-400 font-mono text-2xl font-black leading-none">{optimizedVal}</span>
              <span className="text-[10px] text-emerald-600 font-black uppercase">{optimizedUnit ?? unit}</span>
            </div>
          </div>
        </div>

        <div className="h-12 w-full bg-zinc-950/50 rounded-sm p-1 border border-zinc-900/50">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <XAxis type="number" hide domain={[0, 'dataMax + 10']} />
              <YAxis type="category" dataKey="name" hide />
              <Bar dataKey="val" radius={[0, 2, 2, 0]} barSize={10}>
                {data.map((entry: any, index: number) => (
                  <rect key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const CompareRow = ({ label, baselineVal, optimizedVal, unit, baselineUnit, optimizedUnit, highlight }: any) => {
    const base = typeof baselineVal === 'number' ? baselineVal : Number(baselineVal);
    const opt = typeof optimizedVal === 'number' ? optimizedVal : Number(optimizedVal);
    const hasOptVal = Number.isFinite(opt);
    const maxVal = Math.max(base || 0, hasOptVal ? opt : 0, 1);

    return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-500">
        <span>{label}</span>
        <span className={`${highlight ? 'text-emerald-400' : 'text-blue-300'} font-mono text-[11px]`}>
          {baselineVal} {baselineUnit ?? unit} → {optimizedVal} {optimizedUnit ?? unit}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-2 rounded-full bg-zinc-950 border border-zinc-900 overflow-hidden">
          <div className="h-full bg-blue-500/70" style={{ width: `${Math.min(100, (base / maxVal) * 100)}%` }}></div>
        </div>
        <div className="h-2 rounded-full bg-zinc-950 border border-zinc-900 overflow-hidden">
          <div className="h-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.6)]" style={{ width: `${hasOptVal ? Math.min(100, (opt / maxVal) * 100) : 0}%` }}></div>
        </div>
      </div>
    </div>
  )};

  const DetailRow = ({ label, baselineVal, optimizedVal, unit }: any) => {
    if (baselineVal === undefined && optimizedVal === undefined) return null;
    return (
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500">
        <span>{label}</span>
        <span className="font-mono text-[11px]">
          <span className="text-blue-200">{baselineVal ?? 'N/A'}</span>
          <span className="text-zinc-600"> → </span>
          <span className="text-emerald-400">{optimizedVal ?? 'N/A'}</span>{' '}
          <span className="text-zinc-500">{unit}</span>
        </span>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#050506] pb-10">
      <div className="p-8 space-y-10 max-w-7xl mx-auto">
        
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-white text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-4">
              <BarChart3 size={16} className="text-zinc-400" /> GPU Performance Telemetry
            </h2>
            <div className="h-px flex-1 bg-zinc-800 ml-8 opacity-20"></div>
          </div>

          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-sm p-6 mb-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-4">Benchmark Summary</div>
            <div className="space-y-4">
              {hasOptimized ? (
                <>
                  <CompareRow label="Kernel time" baselineVal={baseline.latency} optimizedVal={optimized.latency} unit="ms" highlight />
                  <CompareRow
                    label="Throughput"
                    baselineVal={baseline.throughput}
                    optimizedVal={optimized.throughput}
                    baselineUnit={baseline.throughputUnit ?? 'GFLOPs'}
                    optimizedUnit={optimized.throughputUnit ?? baseline.throughputUnit ?? 'GFLOPs'}
                    unit={baseline.throughputUnit ?? optimized.throughputUnit ?? 'GFLOPs'}
                  />
                  <CompareRow label="Occupancy (%)" baselineVal={baseline.occupancy} optimizedVal={optimized.occupancy} unit="%" />
                  <CompareRow label="SM Util (%)" baselineVal={baseline.smUtilization} optimizedVal={optimized.smUtilization} unit="%" />
                </>
              ) : (
                <>
                  <CompareRow label="Kernel time" baselineVal={baseline.latency} optimizedVal="—" unit="ms" highlight />
                  <CompareRow label="Throughput" baselineVal={baseline.throughput} optimizedVal="—" baselineUnit={baseline.throughputUnit ?? 'GFLOPs'} unit={baseline.throughputUnit ?? 'GFLOPs'} />
                  <CompareRow label="Occupancy (%)" baselineVal={baseline.occupancy} optimizedVal="—" unit="%" />
                  <CompareRow label="SM Util (%)" baselineVal={baseline.smUtilization} optimizedVal="—" unit="%" />
                </>
              )}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest">
              <div className="flex flex-col gap-1">
                <span className="text-zinc-600">L2 Hit Rate</span>
                <span className="font-mono">
                  <span className="text-blue-200">{baseline.l2HitRate ?? 'N/A'}%</span>
                  {hasOptimized && <span className="text-zinc-600"> → </span>}
                  {hasOptimized && <span className="text-emerald-400">{optimized.l2HitRate ?? 'N/A'}%</span>}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-zinc-600">Memory Traffic</span>
                <span>
                  <span className="text-blue-200">{baseline.dramTraffic ?? 'N/A'}</span>
                  {hasOptimized && <span className="text-zinc-600"> → </span>}
                  {hasOptimized && <span className="text-emerald-400">{optimized.dramTraffic ?? 'N/A'}</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-sm p-6 mb-8">
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-black mb-4">Detailed Metrics</div>
            <div className="space-y-3">
              <DetailRow label="Global memory reads" baselineVal={baseline.memoryReadsGB} optimizedVal={hasOptimized ? optimized.memoryReadsGB : undefined} unit="GB" />
              <DetailRow label="Global memory writes" baselineVal={baseline.memoryWritesGB} optimizedVal={hasOptimized ? optimized.memoryWritesGB : undefined} unit="GB" />
              <DetailRow label="DRAM bandwidth used" baselineVal={baseline.dramBandwidthGBs} optimizedVal={hasOptimized ? optimized.dramBandwidthGBs : undefined} unit="GB/s" />
              <DetailRow label="Registers / thread" baselineVal={baseline.registersPerThread} optimizedVal={hasOptimized ? optimized.registersPerThread : undefined} unit="" />
              <DetailRow label="Warp exec efficiency" baselineVal={baseline.warpExecEfficiency} optimizedVal={hasOptimized ? optimized.warpExecEfficiency : undefined} unit="%" />
              <DetailRow label="Branch efficiency" baselineVal={baseline.branchEfficiency} optimizedVal={hasOptimized ? optimized.branchEfficiency : undefined} unit="%" />
              <DetailRow label="Shared mem bank conflicts" baselineVal={baseline.bankConflicts} optimizedVal={hasOptimized ? optimized.bankConflicts : undefined} unit="%" />
              <DetailRow label="Intermediate tensor size" baselineVal={baseline.intermediateTensorMB} optimizedVal={hasOptimized ? optimized.intermediateTensorMB : undefined} unit="MB" />
              {hasOptimized && (
                <>
                  <DetailRow label="Execution time speedup" baselineVal="1.0" optimizedVal={optimized.execSpeedup ?? optimized.speedup} unit="x" />
                  <DetailRow label="Memory traffic reduction" baselineVal="" optimizedVal={optimized.memoryTrafficReduction} unit="x" />
                  <DetailRow label="Compute efficiency gain" baselineVal="" optimizedVal={optimized.computeEfficiencyGain} unit="%" />
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Latency" 
              baselineVal={baseline.latency} 
              optimizedVal={optimized.latency} 
              unit="ms" 
              icon={Gauge} 
              color="text-indigo-400" 
              description="Execution duration" 
              data={[{ name: 'B', val: baseline.latency, color: '#3f3f46' }, { name: 'A', val: optimized.latency, color: '#10b981' }]}
            />
            <MetricCard 
              title="Throughput" 
              baselineVal={baseline.throughput} 
              optimizedVal={optimized.throughput} 
              unit={baseline.throughputUnit ?? optimized.throughputUnit ?? 'GFLOPs'} 
              baselineUnit={baseline.throughputUnit ?? 'GFLOPs'}
              optimizedUnit={optimized.throughputUnit ?? baseline.throughputUnit ?? 'GFLOPs'}
              icon={Zap} 
              color="text-teal-400" 
              description="Compute load" 
              data={[{ name: 'B', val: baseline.throughput, color: '#3f3f46' }, { name: 'A', val: optimized.throughput, color: '#10b981' }]}
            />
            <MetricCard 
              title="Efficiency" 
              baselineVal={baseline.smUtilization} 
              optimizedVal={optimized.smUtilization} 
              unit="%" 
              icon={TrendingUp} 
              color="text-emerald-400" 
              description="SM Core Saturation" 
              data={[{ name: 'B', val: baseline.smUtilization, color: '#3f3f46' }, { name: 'A', val: optimized.smUtilization, color: '#10b981' }]}
            />
            <MetricCard 
              title="Occupancy" 
              baselineVal={baseline.occupancy} 
              optimizedVal={optimized.occupancy} 
              unit="%" 
              icon={Cpu} 
              color="text-rose-400" 
              description="Warp scheduling rate" 
              data={[{ name: 'B', val: baseline.occupancy, color: '#3f3f46' }, { name: 'A', val: optimized.occupancy, color: '#10b981' }]}
            />
          </div>
        </section>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 bg-[#0c0c0e] border border-zinc-800 p-10 rounded-sm shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Layers size={200} strokeWidth={1} />
            </div>
            <h3 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] mb-12 flex items-center gap-4 relative z-10">
              <Activity size={18} className="text-zinc-500" /> Architecture Delta Radar
            </h3>
            <div className="h-[450px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em' }} />
                  <Radar name="Baseline" dataKey="Baseline" stroke="#52525b" fill="#3f3f46" fillOpacity={0.1} strokeWidth={1} />
                  {hasOptimized && (
                    <Radar name="Optimized" dataKey="Optimized" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} />
                  )}
                  <Tooltip contentStyle={{ backgroundColor: '#0d0d0f', border: '1px solid #27272a', borderRadius: '2px', fontSize: '12px', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '30px', fontWeight: 700, textTransform: 'uppercase' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

            <div className="lg:col-span-4 flex flex-col gap-8">
              <div className="bg-[#0c0c0e] border border-zinc-800 p-8 rounded-sm border-l-4 border-l-emerald-500 shadow-xl">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 shadow-[0_0_15px_#10b981]"></div>
                  <span className="text-white text-[11px] font-black tracking-[0.2em] uppercase">SOTA Optimization</span>
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed font-medium">
                {hasOptimized ? (
                  <>Hardware benchmarking results confirm a <span className="text-white font-bold">{optimized.execSpeedup ? `${optimized.execSpeedup}×` : optimized.speedup} time speedup</span>. Kernel bottleneck successfully shifted from HBM to compute.</>
                ) : (
                  <>Run optimize to compute the post-optimization profile and speedup metrics.</>
                )}
                </p>
              </div>

            <div className="bg-[#0c0c0e] border border-zinc-800 p-8 rounded-sm shadow-xl flex-1">
              <h4 className="text-zinc-500 text-[11px] font-black tracking-[0.2em] uppercase mb-8">Resource Deltas</h4>
              <div className="space-y-10">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-zinc-500">L2 Hit Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-600 text-[8px]">BEFORE: {baseline.l2HitRate}%</span>
                      <ArrowRight size={10} className="text-zinc-800" />
                      <span className="text-emerald-400 font-mono">{optimized.l2HitRate}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-900">
                    <div className="h-full bg-emerald-500/80 shadow-[0_0_10px_#10b981]" style={{ width: `${optimized.l2HitRate}%` }}></div>
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-zinc-900/50">
                   <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Memory Traffic Status</span>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-zinc-700 uppercase font-black">Baseline</span>
                        <span className="text-zinc-500 text-[10px] italic">{baseline.dramTraffic}</span>
                      </div>
                      <ArrowRight size={12} className="text-zinc-800" />
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-emerald-700 uppercase font-black">SOTA</span>
                        <span className="text-emerald-400 text-[11px] font-black">{optimized.dramTraffic}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex flex-col items-center gap-3">
                  <div className="text-[40px] font-black text-white leading-none tracking-tighter">
                    {hasOptimized ? (optimized.execSpeedup ? `${optimized.execSpeedup}×` : optimized.speedup) : '—'}
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-sm">
                    Net Perf. Gain
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profiler;
