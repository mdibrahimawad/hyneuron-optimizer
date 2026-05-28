# KernelOptic AI

A GPU kernel optimization workbench for CUDA code, profiler telemetry, and AI-assisted performance analysis.

KernelOptic AI is a browser-based interface for exploring GPU optimization ideas. Pick a kernel, generate the baseline, inspect the code, run the optimization pass, accept the diff, and compare before and after performance metrics in a profiler-style dashboard.

Built for people who care about memory traffic, occupancy, SM utilization, register pressure, and the gap between naive code and fast code.

Open the kernel. Read the diff. Check the telemetry.

## What is inside

KernelOptic AI combines three pieces into one workspace:

- A CUDA-focused code editor
- An optimization assistant
- A GPU profiler view

The current app is a Vite, React, and TypeScript front end. It includes built-in demo kernels, generated optimization diffs, mock benchmark metrics, syntax highlighting, and Gemini-powered chat helpers.

## Features

- CUDA kernel workspace
- Animated baseline code generation
- Built-in demo kernels
- Optimization diff view
- Accept optimized code flow
- AI assistant panel
- Gemini chat integration
- GPU profiler dashboard
- Before and after metric comparison
- Recharts-based performance charts
- Radar chart for architecture deltas
- Terminal-style compiler stream
- Dark technical UI
- Vite development setup

## Demo kernels

KernelOptic ships with three demo workloads.

| Kernel | Baseline issue | Optimization idea |
| --- | --- | --- |
| Matrix multiplication | Global memory reloads and low arithmetic intensity | Shared memory tiling |
| Parallel reduction | Modulo branching and warp divergence | Shared memory reduction and warp-level unroll |
| FlashAttention-style attention | Materialized score matrix and heavy HBM traffic | Blocked online softmax style flow |

These demos are stored in `constants.tsx`.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS through CDN
- Recharts
- lucide-react
- Google Gemini through `@google/genai`

## Getting started

### Prerequisites

You need Node.js and npm installed.

Recommended:

```bash
node --version
npm --version
```

### Install

```bash
git clone https://github.com/<your-username>/kerneloptic-ai.git
cd kerneloptic-ai
npm install
```

### Configure environment

Create a local environment file:

```bash
cat > .env.local <<'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

The demo kernels, editor, optimization diff, and profiler UI can be explored without calling Gemini.

The assistant chat requires `GEMINI_API_KEY`.

### Run

```bash
npm run dev
```

The Vite server is configured for port `3000`.

Open:

```text
http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production app |
| `npm run preview` | Preview the production build |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Required for AI chat | Used by the Gemini service |

The Vite config maps `GEMINI_API_KEY` into the client as:

```ts
process.env.API_KEY
process.env.GEMINI_API_KEY
```

## Security note

This is a client-side app.

Any API key exposed to the Vite client can be visible in the browser bundle. For a public deployment, move Gemini calls behind a backend route, serverless function, or private API proxy.

## Project structure

```text
.
├── App.tsx
├── components
│   ├── Editor.tsx
│   └── Profiler.tsx
├── constants.tsx
├── index.html
├── index.tsx
├── metadata.json
├── package.json
├── services
│   └── geminiService.ts
├── tsconfig.json
├── types.ts
└── vite.config.ts
```

## How it works

### App shell

`App.tsx` owns the main workspace state.

It tracks:

- active tab
- selected demo kernel
- current code
- generated diff state
- optimization state
- terminal output
- chat messages
- user input

The app has two primary views:

- `editor`
- `profiler`

The editor is shown by default. The profiler appears when a demo case is selected and the profiler tab is opened.

### Demo case flow

Each demo case contains:

- baseline code
- optimized code
- diff code
- explanation
- baseline metrics
- optimized metrics
- source labels

When a user selects a kernel, KernelOptic resets the workspace, prints terminal messages, and animates the baseline code into the editor.

When the user runs optimize, the app prints an optimization stream, animates a diff, and enables the accept flow.

When the user accepts the diff, the editor switches to the optimized version.

### Editor

`components/Editor.tsx` renders the code surface.

It uses a transparent textarea layered above a highlighted code view. The textarea keeps the editing and scrolling behavior native, while the visual layer handles syntax color, line numbers, and diff styling.

Supported highlighting includes:

- CUDA keywords
- C and C++ keywords
- Python and Triton keywords
- numbers
- comments
- types
- added diff lines
- removed diff lines

### Profiler

`components/Profiler.tsx` renders the GPU performance dashboard.

It displays:

- benchmark summary
- detailed memory and execution metrics
- latency card
- throughput card
- SM utilization card
- occupancy card
- architecture delta radar
- resource delta panel
- memory traffic status
- net performance gain

The profiler uses `ProfileMetrics` from `types.ts`.

### Gemini service

`services/geminiService.ts` creates the Gemini client.

It includes two functions:

```ts
optimizeKernel(code)
agentChat(history, message)
```

`optimizeKernel` asks Gemini for a structured JSON optimization response.

`agentChat` sends chat messages to the assistant model with a GPU optimization system instruction.

Current UI behavior mostly uses the built-in demo optimization flow. The chat fallback calls Gemini for general technical questions.

## Data model

The main metric type is:

```ts
interface ProfileMetrics {
  latency: number;
  throughput: number;
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
```

Each demo case follows this shape:

```ts
interface DemoCase {
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
```

## Current demos

### Matrix multiplication

The baseline GEMM reads from global memory repeatedly inside the inner loop.

The optimized version introduces shared memory tiles for A and B, syncs threads around tile loading, and reuses tile data across multiply operations.

Reported demo metrics:

| Metric | Baseline | Optimized |
| --- | --- | --- |
| Latency | 46.8 ms | 4.3 ms |
| Throughput | 215 GFLOPs | 2.85 TFLOPs |
| Occupancy | 41% | 76% |
| SM utilization | 44% | 81% |
| Speedup | 1.0x | 10.9x |

### Parallel reduction

The baseline reduction uses modulo branching at each stride.

The optimized version uses shared memory, fewer divergent branches, and a warp-level final reduction.

Reported demo metrics:

| Metric | Baseline | Optimized |
| --- | --- | --- |
| Latency | 1.21 ms | 0.082 ms |
| Throughput | 13.2 GB/s | 194 GB/s |
| Occupancy | 32% | 69% |
| SM utilization | 54% | 96% |
| Speedup | 1.0x | 14.8x |

### FlashAttention-style attention

The baseline attention flow materializes the full score matrix.

The optimized version uses a blocked flow with online softmax-style state to avoid storing the full intermediate matrix.

Reported demo metrics:

| Metric | Baseline | Optimized |
| --- | --- | --- |
| Latency | 12.6 ms | 1.9 ms |
| Throughput | 0.91 TFLOPs | 5.8 TFLOPs |
| Occupancy | 37% | 74% |
| SM utilization | 37% | 74% |
| Speedup | 1.0x | 6.6x |

## UI model

KernelOptic is designed like a systems tool, not a generic dashboard.

The interface uses:

- dark panels
- thin borders
- compact labels
- monospace output
- terminal-style status lines
- dense profiler cards
- high contrast code blocks
- technical naming

The main interaction is intentionally simple:

```text
select kernel
generate baseline
optimize
review diff
accept
bench
```

## Known limitations

- The profiler metrics are demo data.
- The app does not compile or run real CUDA kernels yet.
- The benchmark output is not connected to Nsight Compute.
- The optimization diff is generated from built-in demo data.
- `optimizeKernel` exists, but the main optimize button currently uses local demo diffs.
- No backend is included.
- Gemini calls are made from the client.
- API key proxying is not implemented.
- Kernel files are not saved to disk.
- No graph or project persistence is included.
- The editor is lightweight and does not use Monaco or CodeMirror.

## Roadmap

- Add real kernel upload
- Add CUDA compile and run backend
- Add Nsight Compute report ingestion
- Add real benchmark execution
- Wire `optimizeKernel` into the main optimization flow
- Add diff accept and reject controls
- Add file export
- Add project persistence
- Add kernel templates
- Add profiler import from CSV
- Add server-side Gemini proxy
- Add tests for demo case flow
- Add CI build workflow

## Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production output:

```bash
npm run preview
```

## Deployment

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

For Vercel, Netlify, Cloudflare Pages, or similar platforms, set the build command to `npm run build` and the publish directory to `dist`.

For public deployments, do not expose a private Gemini key directly in the browser. Use a backend proxy.

## Contributing

Pull requests are welcome.

Good areas to work on:

- real kernel execution
- profiler import
- backend API
- secure Gemini proxy
- editor improvements
- demo expansion
- test coverage
- deployment setup

Keep changes focused, typed, and easy to review.

