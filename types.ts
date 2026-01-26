
export interface ProfileMetrics {
  latency: number;
  throughput: number; // per throughputUnit
  throughputUnit?: 'GFLOPs' | 'TFLOPs' | 'GB/s';
  occupancy: number;
  registerPressure: number;
  smUtilization: number;
  speedup?: string;
  l2HitRate?: number;
  dramTraffic?: string;
  memoryReadsGB?: number;
  memoryWritesGB?: number;
  dramBandwidthGBs?: number;
  registersPerThread?: number;
  warpExecEfficiency?: number;
  branchEfficiency?: number;
  bankConflicts?: number;
  intermediateTensorMB?: number;
  execSpeedup?: number;
  memoryTrafficReduction?: number;
  computeEfficiencyGain?: number;
}

export interface OptimizationResult {
  originalCode: string;
  optimizedCode: string;
  explanation: string;
  metrics: {
    latency: number;
    occupancy: number;
    memoryThroughput: number;
    computationalEfficiency: number;
    timeEfficiency: number;
    registerPressure: number;
    smUtilization: number;
  };
}

export interface DemoCase {
  id: string;
  name: string;
  baselineCode: string;
  optimizedCode: string;
  diffCode: string;
  explanation: string;
  baselineMetrics: ProfileMetrics;
  optimizedMetrics: ProfileMetrics;
  sources: {
    code: string;
    optimized: string;
    benchmarks: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: string[];
  isThinking?: boolean;
}
