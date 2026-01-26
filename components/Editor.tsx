
import React, { useRef, useEffect } from 'react';
import { SYNTAX_COLORS } from '../constants';

interface EditorProps {
  value: string;
  onChange?: (val: string) => void;
  readOnly?: boolean;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, readOnly }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlightCode = (code: string) => {
    return code.split('\n').map((line, i) => {
      const isAdded = line.startsWith('+');
      const isRemoved = line.startsWith('-');
      const lineStyle = isAdded ? { backgroundColor: '#16331f' } : isRemoved ? { backgroundColor: '#331616' } : {};
      
      const cleanLine = isAdded || isRemoved ? line.substring(1) : line;
      const parts = cleanLine.split(/(\s+|[(),;{}[\]#=:.])|(@)/);

      return (
        <div key={i} className="flex leading-6 min-h-[1.5rem] group" style={lineStyle}>
          <span className="w-12 text-zinc-700 text-right pr-4 select-none text-[11px] font-bold flex-shrink-0 border-r border-zinc-900 bg-[#0a0a0c] group-hover:text-zinc-400 transition-colors">{i + 1}</span>
          <div className="flex flex-wrap pl-4 flex-1">
            {isAdded && <span className="text-emerald-500 mr-2 font-bold font-mono">+</span>}
            {isRemoved && <span className="text-rose-500 mr-2 font-bold font-mono">-</span>}
            {parts.map((part, pi) => {
              if (!part) return null;
              if (/^\s+$/.test(part)) {
                return (
                  <span key={pi} className="font-mono whitespace-pre">
                    {part}
                  </span>
                );
              }
              let color = '#d4d4d8';
              // Keywords (CUDA + C++ + Python/Triton)
              if (/^(def|if|else|elif|for|while|return|import|from|as|in|None|True|False|@|triton|jit|range|pass|__global__|__shared__|__device__|__host__|__syncthreads__|void|int|float|extern|const|#define|#include|volatile|unsigned|break|continue)$/.test(part)) color = SYNTAX_COLORS.keyword;
              // Functions
              else if (/^[A-Za-z_][A-Za-z0-9_]*(?=\()/.test(part)) color = SYNTAX_COLORS.function;
              // Types / Namespaces / CUDA Intrinsics
              else if (/^(tl|triton|constexpr|float32|int32|float|int|bool|float4|blockIdx|blockDim|threadIdx|gridDim|dim3)$/.test(part)) color = SYNTAX_COLORS.type;
              // Numbers
              else if (/^\d+(\.\d+)?f?$/.test(part)) color = SYNTAX_COLORS.numeric;
              // Comments
              else if (part.startsWith('#') || part.startsWith('//')) color = SYNTAX_COLORS.comment;
              
              return (
                <span key={pi} className="font-mono whitespace-pre" style={{ color }}>
                  {part}
                </span>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      ref={containerRef}
      className="relative h-full font-mono text-[13px] bg-[#0d0d0f] border border-zinc-800 rounded-sm shadow-xl overflow-hidden"
    >
      <div 
        ref={highlightRef}
        className="absolute inset-0 z-0 p-0 m-0 pointer-events-none py-4 overflow-hidden"
      >
        <div className="min-w-max">
          {highlightCode(value)}
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className={`absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-0 m-0 border-none outline-none resize-none z-10 pl-[64px] leading-6 py-4 selection:bg-white/20 whitespace-pre font-mono overflow-auto ${readOnly ? 'cursor-default' : ''}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        onScroll={handleScroll}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};

export default Editor;
