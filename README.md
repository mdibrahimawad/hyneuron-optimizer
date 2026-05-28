# HyNeuron IDE

A visual neural-network workspace for building model graphs, generating PyTorch, and reasoning about GPU performance from the same interface.

HyNeuron is a browser IDE for people who think about deep learning like systems code. Drag layers onto the graph, wire the model, inspect generated PyTorch, ask the optimization agent for kernel-level improvements, and view an Nsight Compute-inspired profiler panel.

Open the graph. Read the code. Tune the system.

## What it does

HyNeuron brings four workflows into one screen:

- Visual model design
- PyTorch code generation
- AI-assisted optimization
- Profiler-style performance inspection

The current app is a Vite, React, and TypeScript front end. It ships with a live visual graph editor, generated PyTorch output, a Gemini-powered optimization agent, and mock NVIDIA profiler data for the performance view.

## Features

- Visual graph editor with draggable nodes
- Drag and drop layer creation from the component toolbox
- Multi-node selection with marquee select
- Node connection UI with curved SVG edges
- Live graph to PyTorch code generation
- Code to graph sync through Gemini structured JSON output
- Optimization chat panel for model and kernel suggestions
- Nsight Compute-inspired profiler screen
- Mock B200 GPU metrics and kernel table
- Light and dark mode
- Brutalist black and white interface
- Tailwind-powered layout through the CDN
- React 19 and TypeScript project structure

## Current layer support

The UI includes a broad toolbox of neural-network components. The code generator currently emits concrete PyTorch for the core layers below.

| Layer | Generated PyTorch |
| --- | --- |
| `Conv2D` | `nn.Conv2d(...)` |
| `Linear` | `nn.Linear(...)` |
| `ReLU` | `nn.ReLU()` |
| `MaxPool2D` | `nn.MaxPool2d(...)` |
| `Flatten` | `nn.Flatten(...)` |

Other toolbox items are present as interface components or experimental placeholders. They render in the graph, but the current generator writes comments for unsupported node types until full codegen support is added.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS through CDN
- Google Gemini API through `@google/genai`
- lucide-react icons

## Getting started

### Prerequisites

You need Node.js and npm installed.

### Install

```bash
git clone https://github.com/<your-username>/hyneuron.git
cd hyneuron
npm install
```

### Configure Gemini

Create a local environment file:

```bash
cat > .env.local <<'EOF'
GEMINI_API_KEY=your_gemini_api_key_here
EOF
```

The visual editor and generated code view can be explored without using Gemini calls. The optimization chat and code to graph sync require `GEMINI_API_KEY`.

### Run the app

```bash
npm run dev
```

The dev server is configured to run on port `3000`.

Open:

```text
http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local Vite development server |
| `npm run build` | Build the production app |
| `npm run preview` | Preview the production build locally |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes for AI features | Used by the Gemini service for optimization and code to graph conversion |

Vite maps `GEMINI_API_KEY` into the client runtime as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`.

## Security note

This is a client-side Vite app. Any key injected into the front end can be visible to users in a production deployment.

For a public deployment, do not expose a private Gemini API key directly in the browser. Put Gemini calls behind a small server API, serverless function, or backend proxy.

## Project structure

```text
.
├── App.tsx
├── components
│   ├── NCUProfiler.tsx
│   └── VisualGraph.tsx
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

## Architecture

### App shell

`App.tsx` owns the main application state:

- active tab
- graph nodes
- generated code
- optimization chat messages
- dark mode
- selected node state

It renders the left component toolbox, the center workspace, the top navigation, the footer telemetry strip, and the right optimization agent panel.

### Visual graph

`components/VisualGraph.tsx` handles the graph workspace.

It supports:

- dragging nodes
- selecting nodes
- moving selected groups
- drawing selection boxes
- connecting nodes through input and output ports
- removing nodes
- rendering SVG edge paths between connected nodes

Graph data is stored as an array of `DLNode` objects.

```ts
interface DLNode {
  id: string;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  params: Record<string, string | number>;
  inputs: string[];
}
```

### Code generation

`services/geminiService.ts` contains `blocksToCode`.

It turns the current graph into a PyTorch `nn.Module`:

```python
import torch
import torch.nn as nn

class Model(nn.Module):
    def __init__(self):
        super().__init__()

    def forward(self, x):
        return x
```

The generated code updates automatically from graph state with a short debounce, so dragging stays responsive.

### AI optimization

The right panel acts as an optimization agent.

When a message includes `optimize`, HyNeuron sends the current PyTorch code to Gemini with instructions focused on:

- kernel fusion
- parallelism efficiency
- memory throughput
- Tensor Core utilization
- NVIDIA B200-style optimization targets

The returned text is displayed as an optimization patch in the chat.

### Code to graph sync

The `SYNC_GRAPH` action sends the current code to Gemini and asks for a structured JSON list of visual nodes.

Expected node fields:

```ts
{
  id: string;
  type: string;
  params: object;
  inputs: string[];
  position?: {
    x: number;
    y: number;
  };
}
```

If Gemini returns valid nodes, the visual graph updates.

### Profiler

`components/NCUProfiler.tsx` renders a profiler-style dashboard from `MOCK_NCU_REPORT` in `constants.tsx`.

It includes:

- kernel execution table
- selected kernel display
- hardware metric cards
- throughput bars
- optimization alert panel
- mock export controls

The current profiler is a UI and data visualization layer. It does not yet parse real `.ncu-rep`, CSV, or XLSX profiler exports.

## Design direction

HyNeuron uses a sharp, technical visual style:

- black and white panels
- hard borders
- square shadows
- uppercase labels
- dense telemetry-style text
- monospace code and metric output
- dark mode inversion

The goal is to feel closer to a systems dashboard than a typical low-code builder.

## Known limitations

- The profiler data is currently mock data.
- `RUN_INSTRUMENT`, `DEPLOY_CORE`, `EXPORT_CSV`, and `RAW_XLSX` are interface controls and are not wired to a backend yet.
- Code generation uses a simple node order and does not fully topologically sort the graph.
- Unsupported layer types are rendered as comments in generated code.
- The Gemini API key is exposed in the client build unless moved behind a backend.
- Graph persistence is not implemented yet.
- Parameter editing UI is not fully wired yet.

## Roadmap

- Save and load graph JSON
- Export generated PyTorch files
- Add a real node parameter inspector
- Add full topological graph sorting
- Add codegen support for attention, recurrent, normalization, dropout, and embedding layers
- Add a backend execution runner
- Add real Nsight Compute CSV or XLSX ingestion
- Add graph import and export
- Add project templates for CNNs, transformers, and MLPs
- Add a secure server-side Gemini proxy
- Add tests for graph operations and code generation

## Development notes

Before building, make sure the JSX does not contain duplicate props.

There is currently a duplicated `onMouseDown` prop in `components/VisualGraph.tsx` on the output port button. Remove the first duplicate handler and keep the handler that starts the connection drag.

After that, run:

```bash
npm install
npm run build
```

## Deployment

Build the app:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

For platforms like Vercel, Netlify, or Cloudflare Pages, set the build command to:

```bash
npm run build
```

Set the output directory to:

```text
dist
```

Add `GEMINI_API_KEY` in the platform environment settings only for private demos or protected deployments. For public deployments, use a backend proxy instead.

## Contributing

Pull requests are welcome.

Good first areas to work on:

- layer code generation
- graph persistence
- profiler import support
- backend execution
- API key proxying
- UI polish
- test coverage

Keep changes small, typed, and easy to review.

