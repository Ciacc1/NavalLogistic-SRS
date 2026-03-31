/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { analyzeLogs, LogAnomaly } from './services/geminiService';
import { 
  ShieldAlert, 
  Terminal, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Loader2,
  Upload,
  Trash2,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

const SAMPLE_LOGS = `
2026-03-30T10:00:01Z container-web-1 [INFO] Server started on port 80
2026-03-30T10:05:22Z container-db-1 [ERROR] Connection timeout from 172.18.0.5
2026-03-30T10:05:23Z container-db-1 [WARNING] Retrying connection (1/3)
2026-03-30T10:10:45Z container-web-1 [INFO] GET /api/v1/users 200 45ms
2026-03-30T10:12:10Z container-worker-1 [CRITICAL] Out of memory: Kill process 452 (node)
2026-03-30T10:12:11Z container-worker-1 [INFO] Container restarting...
2026-03-30T10:15:00Z container-web-1 [WARNING] High CPU usage detected: 92%
`;

export default function App() {
  const [logs, setLogs] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ summary: string; anomalies: LogAnomaly[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!logs.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    try {
      const analysis = await analyzeLogs(logs);
      setResult(analysis);
    } catch (err) {
      setError('Si è verificato un errore durante l\'analisi dei log.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearLogs = () => {
    setLogs('');
    setResult(null);
  };

  const loadSample = () => {
    setLogs(SAMPLE_LOGS.trim());
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-900/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">Docker Log Sentinel</h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              AI AGENT ACTIVE
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-[600px]">
              <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                  <Terminal className="w-4 h-4" />
                  Log Input
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={loadSample}
                    className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Load Sample
                  </button>
                  <button 
                    onClick={clearLogs}
                    className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <textarea
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                placeholder="Incolla qui i log del container Docker..."
                className="flex-1 p-4 bg-transparent outline-none resize-none font-mono text-sm text-zinc-300 placeholder:text-zinc-700 leading-relaxed"
              />
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/20">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !logs.trim()}
                  className={cn(
                    "w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200",
                    isAnalyzing 
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                      : "bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20 active:scale-[0.98]"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analisi in corso...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      Avvia Analisi AI
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7 space-y-6">
            <AnimatePresence mode="wait">
              {!result && !isAnalyzing ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-[600px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-3xl"
                >
                  <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6">
                    <Activity className="w-8 h-8 text-zinc-700" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nessuna analisi attiva</h3>
                  <p className="text-zinc-500 max-w-sm">
                    Incolla i log dei tuoi container Docker a sinistra per iniziare il rilevamento delle anomalie basato su intelligenza artificiale.
                  </p>
                </motion.div>
              ) : isAnalyzing ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-[600px] flex flex-col items-center justify-center p-8 bg-zinc-900/20 border border-zinc-800 rounded-3xl"
                >
                  <div className="relative mb-8">
                    <div className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                    <ShieldAlert className="w-8 h-8 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Gemini sta analizzando i log...</h3>
                  <p className="text-zinc-500 text-sm animate-pulse">Rilevamento pattern, errori e anomalie di sistema</p>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Card */}
                  <section className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">
                      <Info className="w-4 h-4" />
                      Executive Summary
                    </div>
                    <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed">
                      <ReactMarkdown>{result?.summary || ''}</ReactMarkdown>
                    </div>
                  </section>

                  {/* Anomalies List */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 px-1 flex items-center gap-2">
                      Anomalie Rilevate ({result?.anomalies.length})
                    </h3>
                    {result?.anomalies.map((anomaly, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden"
                      >
                        <div className={cn(
                          "px-4 py-2 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between",
                          anomaly.severity === 'critical' ? "bg-red-500/10 text-red-500" :
                          anomaly.severity === 'high' ? "bg-orange-500/10 text-orange-500" :
                          anomaly.severity === 'medium' ? "bg-yellow-500/10 text-yellow-500" :
                          "bg-blue-500/10 text-blue-500"
                        )}>
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            {anomaly.severity} Priority
                          </div>
                          <span className="font-mono opacity-60">{anomaly.timestamp}</span>
                        </div>
                        <div className="p-5 space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-1">{anomaly.message}</h4>
                            <p className="text-xs text-zinc-500 font-mono">{anomaly.containerId || 'Unknown Container'}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-black/20 p-3 rounded-xl border border-zinc-800/50">
                              <span className="text-[10px] font-bold text-zinc-600 uppercase block mb-1">Spiegazione</span>
                              <p className="text-xs text-zinc-400 leading-relaxed">{anomaly.explanation}</p>
                            </div>
                            <div className="bg-orange-500/5 p-3 rounded-xl border border-orange-500/10">
                              <span className="text-[10px] font-bold text-orange-500/60 uppercase block mb-1">Azione Suggerita</span>
                              <p className="text-xs text-orange-200/80 leading-relaxed font-medium">{anomaly.suggestedAction}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {result?.anomalies.length === 0 && (
                      <div className="bg-green-500/5 border border-green-500/20 p-8 rounded-3xl text-center">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-4" />
                        <h4 className="text-green-400 font-semibold">Nessuna anomalia rilevata</h4>
                        <p className="text-green-900/60 text-sm mt-1">I log sembrano indicare un sistema in salute.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-600 text-xs">
          <p>© 2026 Docker Log Sentinel AI Agent. Powered by Gemini 3 Flash.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Documentation</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">API Reference</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
