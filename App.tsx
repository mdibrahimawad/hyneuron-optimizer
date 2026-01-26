import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  FileCode,
  Sparkles,
  Command,
  ArrowRight,
  Cpu,
  Settings,
  Activity,
  Layers,
  Play,
} from 'lucide-react';

import { NAV_ITEMS, DEMO_CASES } from './constants';
import { ChatMessage, DemoCase } from './types';
import Editor from './components/Editor';
import Profiler from './components/Profiler';
import { agentChat } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('editor');
  const [kernelCode, setKernelCode] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasOptimized, setHasOptimized] = useState(false);
  const [currentCase, setCurrentCase] = useState<DemoCase | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'KernelOptic Intelligence Layer initialized. Please select a kernel architecture to begin SOTA analysis.',
    },
  ]);
  const [userInput, setUserInput] = useState('');

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const isDiffView =
    kernelCode.includes('---') || kernelCode.includes('+++');

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalOutput, isOptimizing]);

  const resetWorkspace = () => {
    setKernelCode('');
    setIsOptimizing(false);
    setIsBenchmarking(false);
    setTerminalOutput([]);
    setActiveTab('editor');
  };

  const handleCommand = async (input: string) => {
    const text = input.toLowerCase();

    if (text.includes('attention')) {
      handleSelectCase('flash_attention');
      return;
    }

    if (text.includes('gemm') || text.includes('matmul')) {
      handleSelectCase('tiled_matmul');
      return;
    }

    if (text.includes('reduction')) {
      handleSelectCase('parallel_reduction');
      return;
    }

    const reply = await agentChat(chatMessages, input);
    setChatMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
  };

  const optimizeRunRef = useRef(0);
  const generateRunRef = useRef(0);

  const animateCode = async (code: string, runRef: React.MutableRefObject<number>) => {
    const runId = ++runRef.current;
    const lines = code.split('\n');
    setKernelCode('');

    for (let i = 0; i < lines.length; i++) {
      if (runId !== runRef.current) return;
      setKernelCode((prev) => (prev ? `${prev}\n${lines[i]}` : lines[i]));
      await new Promise((r) => setTimeout(r, 30));
    }
  };

  const animateDiff = async (code: string) => {
    const runId = ++optimizeRunRef.current;
    const lines = code.split('\n');
    setKernelCode('');

    for (let i = 0; i < lines.length; i++) {
      if (runId !== optimizeRunRef.current) return;
      setKernelCode((prev) => (prev ? `${prev}\n${lines[i]}` : lines[i]));
      await new Promise((r) => setTimeout(r, 35));
    }
  };

  const handleOptimize = async () => {
    if (!currentCase) return;

    setIsOptimizing(true);
    setChatMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Thinking through the optimization approach...' },
    ]);
    setTerminalOutput((prev) => [
      ...prev,
      '>> Starting optimization pass...',
    ]);

    await new Promise((r) => setTimeout(r, 600));
    setTerminalOutput((prev) => [...prev, '>> Analyzing baseline access patterns...']);
    await new Promise((r) => setTimeout(r, 700));
    setTerminalOutput((prev) => [...prev, '>> Identifying bottlenecks and reuse opportunities...']);
    await new Promise((r) => setTimeout(r, 700));
    setTerminalOutput((prev) => [...prev, '>> Planning optimization steps...']);
    await new Promise((r) => setTimeout(r, 600));

    await animateDiff(currentCase.diffCode);

    setTerminalOutput((prev) => [
      ...prev,
      '>> Optimization diff ready. Review and accept changes.',
    ]);
    setChatMessages((prev) => [
      ...prev,
      { role: 'assistant', content: 'Optimization draft ready. Review the diff and accept changes when ready.' },
    ]);

    setIsOptimizing(false);
    setHasOptimized(true);
  };

  const handleAccept = () => {
    if (!currentCase) return;
    setKernelCode(currentCase.optimizedCode);
    setTerminalOutput((prev) => [
      ...prev,
      '>> Changes COMMITTED.',
    ]);
    setHasOptimized(true);
  };

  const targets = [
    {
      id: 'tiled_matmul',
      title: 'Generate a CUDA implementation of matrix multiplication',
      subtitle: 'Baseline kernel',
    },
    {
      id: 'parallel_reduction',
      title: 'Generate a CUDA implementation of parallel reduction',
      subtitle: 'Baseline kernel',
    },
    {
      id: 'flash_attention',
      title: 'Generate a CUDA implementation of scaled dot-product attention',
      subtitle: 'Baseline kernel',
    },
  ];

  const buildCaseNarrative = (demo: DemoCase, promptLabel: string): ChatMessage[] => [
    {
      role: 'assistant',
      content: `Generating a CUDA implementation of ${promptLabel.replace(/^Generate a CUDA implementation of /, '')}.\nDo you want to optimize or bench ?`,
    },
  ];

  const handleSelectCase = async (caseId: string) => {
    const demo = DEMO_CASES[caseId];
    if (!demo) return;
    const promptLabel = targets.find((t) => t.id === caseId)?.title ?? demo.name;
    resetWorkspace();
    setCurrentCase(demo);
    setChatMessages(buildCaseNarrative(demo, promptLabel));
    setHasOptimized(false);
    setTerminalOutput([
      `>> Request: ${demo.name}`,
      '>> Mode: Baseline generation only',
      '>> Status: Generating baseline kernel...',
    ]);
    setIsGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    await animateCode(demo.baselineCode, generateRunRef);
    setTerminalOutput((prev) => [
      ...prev,
      '>> Baseline kernel generated.',
      '>> Awaiting optimize/bench request.',
    ]);
    setIsGenerating(false);
  };

  const handleBench = () => {
    setActiveTab('profiler');
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: userInput },
    ]);
    handleCommand(userInput);
    setUserInput('');
  };

  return (
    <div className="relative flex min-h-screen bg-[#0a0a0c] text-zinc-100 overflow-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />

      {/* Sidebar */}
      <div className="relative z-10 w-14 border-r border-zinc-800/70 bg-[#0e0e12] flex flex-col items-center py-5 gap-6">
        <div className="h-9 w-9 rounded-md bg-white text-black flex items-center justify-center shadow-lg">
          <Command size={18} />
        </div>
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`h-9 w-9 rounded-md border border-zinc-800/70 flex items-center justify-center transition-colors ${
              activeTab === 'editor' ? 'bg-white text-black' : 'bg-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
            aria-label="Show code editor"
          >
            <FileCode size={18} />
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profiler')}
            className={`h-9 w-9 rounded-md border border-zinc-800/70 flex items-center justify-center transition-colors ${
              activeTab === 'profiler' ? 'bg-white text-black' : 'bg-transparent text-zinc-400 hover:text-white hover:border-zinc-600'
            }`}
            aria-label="Show GPU profiler"
          >
            <Activity size={18} />
          </button>
          <Layers size={18} className="text-zinc-600" />
          <Cpu size={18} className="text-zinc-600" />
          <Settings size={18} className="text-zinc-600" />
        </div>
      </div>

      {/* Main */}
      <div className="relative z-10 flex-1 flex flex-col border-r border-zinc-800/70">
        <header className="h-12 border-b border-zinc-800/70 flex items-center justify-between px-5 bg-[#0d0d11]/80 backdrop-blur">
          <div className="flex items-center gap-3">
            <FileCode size={14} className="text-zinc-400" />
            <span className="text-xs uppercase tracking-[0.24em] text-zinc-300">
              {currentCase
                ? `${currentCase.name}.cu`
                : 'workspace_idle.cu'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isDiffView && (
              <button
                onClick={handleAccept}
                className="px-3 py-1 text-[11px] bg-emerald-500/90 text-black uppercase tracking-[0.2em]"
              >
                Accept
              </button>
            )}
            <button
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="px-4 py-1 text-[11px] bg-white text-black uppercase tracking-[0.2em] inline-flex items-center gap-2"
            >
              <Sparkles size={12} />
              Optimize
            </button>
            <button
              onClick={handleBench}
              className="px-4 py-1 text-[11px] bg-zinc-800/80 border border-zinc-700 uppercase tracking-[0.2em] inline-flex items-center gap-2"
            >
              <Play size={12} />
              Bench
            </button>
          </div>
        </header>

        {/* Editor / Profiler */}
        <main className="flex-1 flex flex-col p-4 gap-4">
          <div className="flex-1 rounded-md border border-zinc-800/80 bg-black/40 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            {activeTab === 'profiler' && currentCase ? (
              <Profiler baseline={currentCase.baselineMetrics} optimized={currentCase.optimizedMetrics} hasOptimized={hasOptimized} />
            ) : (
              <Editor value={kernelCode} readOnly={isOptimizing || isGenerating} />
            )}
          </div>

          {/* Terminal */}
          <div className="h-52 rounded-md border border-zinc-800/80 bg-[#0c0c10]/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] flex flex-col">
            <div className="px-4 py-2 border-b border-zinc-800/70 flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-zinc-400">
              <div className="flex items-center gap-2">
                <Terminal size={12} />
                <span>Compiler Stream (Chain-of-Thought)</span>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-400">HW_LINK: CONNECTED</span>
                <span className="text-zinc-600">CUDA_12.6_PROF</span>
              </div>
            </div>

            <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
              {terminalOutput.length > 0 ? (
                <div className="space-y-1">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className="flex gap-3 text-zinc-400">
                      <span className="text-zinc-600">[{i + 1}]</span>
                      <span>{line}</span>
                    </div>
                  ))}

                  {isOptimizing && (
                    <>
                      <div className="text-white animate-pulse">
                        {">>> _"}
                      </div>
                      <div ref={terminalEndRef} />
                    </>
                  )}
                </div>
              ) : (
                <div className="text-zinc-600 italic h-full flex items-center justify-center">
                  Telemetry idle.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Neural Assist */}
      <aside className="relative z-10 w-[360px] flex flex-col bg-[#0c0c10]/80">
        <div className="h-12 border-b border-zinc-800/70 flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-zinc-300">
            <Sparkles size={14} />
            Neural Assist
          </div>
          <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <section className="rounded-md border border-zinc-800/80 bg-[#0f0f14]/70 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-500 mb-4">
              Frequently Asked Kernel Examples
            </div>
            <div className="space-y-3">
              {targets.map((target) => {
                const isActive = currentCase?.id === target.id;
                return (
                  <button
                    key={target.id}
                    onClick={() => handleSelectCase(target.id)}
                    className={`w-full text-left rounded-md border px-4 py-3 flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-white text-black border-white shadow-[0_10px_30px_rgba(255,255,255,0.15)]'
                        : 'bg-[#0b0b10] text-zinc-200 border-zinc-800/80 hover:border-zinc-600'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold">{target.title}</div>
                      <div
                        className={`text-[12px] uppercase tracking-[0.2em] mt-1 ${
                          isActive ? 'text-zinc-600' : 'text-zinc-500 italic'
                        }`}
                      >
                        {target.subtitle}
                      </div>
                    </div>
                    <ArrowRight size={18} className={`${isActive ? 'text-black' : 'text-zinc-600'}`} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className="rounded-md border border-zinc-800/80 bg-[#0f0f14]/70 p-4 text-sm text-zinc-200 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"
              >
                {m.content}
              </div>
            ))}
          </section>
        </div>

        <div className="p-4 border-t border-zinc-800/70 space-y-3 bg-[#0c0c10]/80">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-zinc-500">
            Optic-1.0_Pro
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <div className="flex items-center gap-2 rounded-md border border-zinc-800/80 bg-[#0a0a0f] px-3 py-2">
            <input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Query GPU logic..."
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 outline-none"
            />
            <button
              onClick={handleSendMessage}
              className="h-7 w-7 rounded-md border border-zinc-700/80 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              aria-label="Send message"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default App;
