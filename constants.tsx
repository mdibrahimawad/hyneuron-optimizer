
import React from 'react';
import { Code, Activity, Settings } from 'lucide-react';
import { DemoCase } from './types';

export const DEMO_CASES: Record<string, DemoCase> = {
  tiled_matmul: {
    id: 'tiled_matmul',
    name: 'Matrix Multiplication (GEMM)',
    baselineCode: `
__global__ void matmul_baseline(
    const float* A,
    const float* B,
    float* C,
    int N
) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;

    if (row < N && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < N; k++) {
            sum += A[row * N + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
    }
}`,
    optimizedCode: `
__global__ void matmul_tiled(
    const float* A,
    const float* B,
    float* C,
    int N
) {
    __shared__ float As[TILE][TILE];
    __shared__ float Bs[TILE][TILE];

    int row = blockIdx.y * TILE + threadIdx.y;
    int col = blockIdx.x * TILE + threadIdx.x;

    float sum = 0.0f;

    for (int t = 0; t < N / TILE; t++) {
        As[threadIdx.y][threadIdx.x] =
            A[row * N + t * TILE + threadIdx.x];
        Bs[threadIdx.y][threadIdx.x] =
            B[(t * TILE + threadIdx.y) * N + col];

        __syncthreads();

        for (int k = 0; k < TILE; k++) {
            sum += As[threadIdx.y][k] * Bs[k][threadIdx.x];
        }

        __syncthreads();
    }

    if (row < N && col < N) {
        C[row * N + col] = sum;
    }
}`,
    diffCode: `--- baseline_gemm.cu
+++ tiled_gemm.cu
-    int row = blockIdx.y * blockDim.y + threadIdx.y;
-    int col = blockIdx.x * blockDim.x + threadIdx.x;
+    __shared__ float As[TILE][TILE];
+    __shared__ float Bs[TILE][TILE];
+    for (int t = 0; t < N / TILE; t++) {
+        As[threadIdx.y][threadIdx.x] =
+            A[row * N + t * TILE + threadIdx.x];
+        Bs[threadIdx.y][threadIdx.x] =
+            B[(t * TILE + threadIdx.y) * N + col];
+
+        __syncthreads();
+
+        for (int k = 0; k < TILE; k++) {
+            sum += As[threadIdx.y][k] * Bs[k][threadIdx.x];
+        }
+
+        __syncthreads();
+    }`,
    explanation: "The baseline GEMM reloads A and B from global memory for every multiply, causing massive redundant reads, poor cache reuse, and low arithmetic intensity. This makes the kernel memory-bound and underutilizes SMs.",
    baselineMetrics: {
      latency: 46.8,
      throughput: 215,
      throughputUnit: "GFLOPs",
      occupancy: 41,
      registerPressure: 24,
      smUtilization: 44,
      speedup: "1.0x",
      l2HitRate: 18,
      dramTraffic: "DRAM-heavy",
      memoryReadsGB: 98.6,
      memoryWritesGB: 33.1,
      dramBandwidthGBs: 612,
      registersPerThread: 24
    },
    optimizedMetrics: {
      latency: 4.3,
      throughput: 2.85,
      throughputUnit: "TFLOPs",
      occupancy: 76,
      registerPressure: 48,
      smUtilization: 81,
      speedup: "10.9x",
      l2HitRate: 71,
      dramTraffic: "Much lower",
      memoryReadsGB: 19.4,
      memoryWritesGB: 8.7,
      dramBandwidthGBs: 214,
      registersPerThread: 48,
      execSpeedup: 10.9,
      memoryTrafficReduction: 4.8,
      computeEfficiencyGain: 37
    },
    sources: {
      code: "baseline_gemm.cu",
      optimized: "tiled_gemm.cu",
      benchmarks: "200 GFLOPs -> 3 TFLOPs"
    }
  },
  parallel_reduction: {
    id: 'parallel_reduction',
    name: 'Parallel Reduction',
    baselineCode: `
__global__ void reduce_baseline(float* input, float* output, int N) {
    int idx = blockIdx.x * blockDim.x + threadIdx.x;

    for (int stride = 1; stride < N; stride *= 2) {
        if (idx % (2 * stride) == 0 && idx + stride < N) {
            input[idx] += input[idx + stride];
        }
        __syncthreads();
    }

    if (idx == 0) {
        *output = input[0];
    }
}`,
    optimizedCode: `
__global__ void reduce_optimized(float* input, float* output) {
    extern __shared__ float sdata[];

    unsigned int tid = threadIdx.x;
    unsigned int i = blockIdx.x * blockDim.x * 2 + tid;

    sdata[tid] = input[i] + input[i + blockDim.x];
    __syncthreads();

    for (unsigned int s = blockDim.x / 2; s > 32; s >>= 1) {
        if (tid < s) {
            sdata[tid] += sdata[tid + s];
        }
        __syncthreads();
    }

    if (tid < 32) {
        volatile float* vsmem = sdata;
        vsmem[tid] += vsmem[tid + 32];
        vsmem[tid] += vsmem[tid + 16];
        vsmem[tid] += vsmem[tid + 8];
        vsmem[tid] += vsmem[tid + 4];
        vsmem[tid] += vsmem[tid + 2];
        vsmem[tid] += vsmem[tid + 1];
    }

    if (tid == 0) {
        output[blockIdx.x] = sdata[0];
    }
}`,
    diffCode: `--- baseline_reduction.cu
+++ optimized_reduction.cu
-    if (idx % (2 * stride) == 0 && idx + stride < N) {
-        input[idx] += input[idx + stride];
+    sdata[tid] = input[i] + input[i + blockDim.x];
+    for (unsigned int s = blockDim.x / 2; s > 32; s >>= 1) {
+        if (tid < s) {
+            sdata[tid] += sdata[tid + s];
+        }
+    }
+    if (tid < 32) {
+        volatile float* vsmem = sdata;
+        vsmem[tid] += vsmem[tid + 32];
+        vsmem[tid] += vsmem[tid + 16];
+        vsmem[tid] += vsmem[tid + 8];
+        vsmem[tid] += vsmem[tid + 4];
+        vsmem[tid] += vsmem[tid + 2];
+        vsmem[tid] += vsmem[tid + 1];
     }`,
    explanation: "The baseline reduction uses modulo-based branching at every stride, causing heavy warp divergence and uncoalesced access. Every step syncs all threads, so latency accumulates and SM efficiency drops.",
    baselineMetrics: {
      latency: 1.21,
      throughput: 13.2,
      throughputUnit: "GB/s",
      occupancy: 32,
      registerPressure: 18,
      smUtilization: 54,
      speedup: "1.0x",
      dramTraffic: "Heavy divergence",
      warpExecEfficiency: 54,
      branchEfficiency: 48,
      bankConflicts: 22,
      registersPerThread: 18
    },
    optimizedMetrics: {
      latency: 0.082,
      throughput: 194,
      throughputUnit: "GB/s",
      occupancy: 69,
      registerPressure: 32,
      smUtilization: 96,
      speedup: "14.8x",
      dramTraffic: "Minimal divergence",
      warpExecEfficiency: 96,
      branchEfficiency: 99,
      bankConflicts: 0,
      registersPerThread: 32,
      execSpeedup: 14.8,
      computeEfficiencyGain: 42
    },
    sources: {
      code: "baseline_reduction.cu",
      optimized: "optimized_reduction.cu",
      benchmarks: "1.2ms -> 0.08ms"
    }
  },
  flash_attention: {
    id: 'flash_attention',
    name: 'FlashAttention-style',
    baselineCode: `
for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
        score[i][j] = dot(Q[i], K[j]);
    }
}

softmax(score);

for (int i = 0; i < N; i++) {
    for (int j = 0; j < N; j++) {
        output[i] += score[i][j] * V[j];
    }
}`,
    optimizedCode: `
for (int block = 0; block < N; block += BLOCK) {
    load Q_block, K_block, V_block into shared memory;

    for (int i = 0; i < BLOCK; i++) {
        float m = -INF;
        float l = 0.0f;

        for (int j = 0; j < BLOCK; j++) {
            float s = dot(Q[i], K[j]);
            float m_new = max(m, s);
            l = l * exp(m - m_new) + exp(s - m_new);
            m = m_new;
            output[i] += exp(s - m) * V[j];
        }

        output[i] /= l;
    }
}`,
    diffCode: `--- baseline_attention.cu
+++ flashattention_style.cu
-    score[i][j] = dot(Q[i], K[j]);
-    softmax(score);
-    output[i] += score[i][j] * V[j];
+    for (int j = 0; j < BLOCK; j++) {
+        float s = dot(Q[i], K[j]);
+        float m_new = max(m, s);
+        l = l * exp(m - m_new) + exp(s - m_new);
+        m = m_new;
+        output[i] += exp(s - m) * V[j];
+    }
+    output[i] /= l;`,
    explanation: "The baseline attention materializes the full N×N score matrix and does a separate softmax pass. This creates large intermediate tensors, saturates HBM bandwidth, and becomes memory-bound for long sequences.",
    baselineMetrics: {
      latency: 12.6,
      throughput: 0.91,
      throughputUnit: "TFLOPs",
      occupancy: 37,
      registerPressure: 40,
      smUtilization: 37,
      speedup: "1.0x",
      l2HitRate: 21,
      dramTraffic: "High HBM traffic",
      memoryReadsGB: 142.3,
      memoryWritesGB: 96.7,
      intermediateTensorMB: 128,
      registersPerThread: 40
    },
    optimizedMetrics: {
      latency: 1.9,
      throughput: 5.8,
      throughputUnit: "TFLOPs",
      occupancy: 74,
      registerPressure: 96,
      smUtilization: 74,
      speedup: "6.6x",
      l2HitRate: 78,
      dramTraffic: "No materialized matrix",
      memoryReadsGB: 28.4,
      memoryWritesGB: 11.2,
      intermediateTensorMB: 0,
      registersPerThread: 96,
      execSpeedup: 6.6,
      memoryTrafficReduction: 6.3,
      computeEfficiencyGain: 41
    },
    sources: {
      code: "baseline_attention.cu",
      optimized: "flashattention_style.cu",
      benchmarks: "5–10× speedup"
    }
  }
};

export const NAV_ITEMS = [
  { id: 'editor', icon: <Code size={18} />, label: 'Editor' },
  { id: 'profiler', icon: <Activity size={18} />, label: 'Profiler' },
  { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
];

export const SYNTAX_COLORS = {
  keyword: '#c678dd',
  function: '#61afef',
  variable: '#e06c75',
  comment: '#5c6370',
  string: '#98c379',
  type: '#d19a66',
  numeric: '#d19a66',
  diffAdd: '#16331f',
  diffRemove: '#331616',
};
