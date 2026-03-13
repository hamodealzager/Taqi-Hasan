/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  Settings, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Terminal,
  Cpu,
  Zap,
  MessageSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Task, Note, UserPreferences, AiInteraction } from './types';
import { GoogleGenAI } from "@google/genai";

// --- Mock Data ---
const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Initialize ERNDA Core', status: 'completed', priority: 'high', createdAt: new Date().toISOString() },
  { id: '2', title: 'Review quarterly objectives', status: 'in-progress', priority: 'medium', createdAt: new Date().toISOString() },
  { id: '3', title: 'Sync knowledge base with Gemini', status: 'pending', priority: 'high', createdAt: new Date().toISOString() },
];

const INITIAL_NOTES: Note[] = [
  { id: '1', title: 'Project Alpha Specs', content: 'Detailed specifications for the upcoming Alpha release...', tags: ['work', 'specs'], updatedAt: new Date().toISOString() },
  { id: '2', title: 'Personal Goals 2026', content: '1. Learn Rust\n2. Run a marathon...', tags: ['personal'], updatedAt: new Date().toISOString() },
];

const DEFAULT_PREFERENCES: UserPreferences = {
  tone: 'professional',
  focusArea: 'General Productivity',
  memoryDepth: 5,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'notes' | 'ai'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  
  // --- Sorting State ---
  const [taskSortBy, setTaskSortBy] = useState<'priority' | 'createdAt'>('createdAt');
  const [taskSortOrder, setTaskSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // --- Enhanced AI State ---
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [history, setHistory] = useState<AiInteraction[]>([]);
  const [showTuning, setShowTuning] = useState(false);

  // --- Sorting Logic ---
  const sortedTasks = useMemo(() => {
    const priorityMap = { high: 3, medium: 2, low: 1 };
    
    return [...tasks].sort((a, b) => {
      let comparison = 0;
      if (taskSortBy === 'priority') {
        comparison = priorityMap[a.priority] - priorityMap[b.priority];
      } else {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return taskSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, taskSortBy, taskSortOrder]);

  // --- AI Logic ---
  const askAi = async () => {
    if (!prompt.trim()) return;
    
    const userMessage: AiInteraction = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };
    
    setHistory(prev => [...prev, userMessage]);
    setIsAiLoading(true);
    setPrompt('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Construct context from history based on memory depth
      const recentHistory = history.slice(-preferences.memoryDepth);
      const historyContext = recentHistory.map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n');

      const systemInstruction = `You are ERNDA, a high-precision personal agenda assistant.
      
      USER PREFERENCES:
      - Tone: ${preferences.tone}
      - Primary Focus: ${preferences.focusArea}
      
      CURRENT DATA:
      - Tasks: ${JSON.stringify(tasks)}
      - Notes: ${JSON.stringify(notes)}
      
      PAST INTERACTIONS:
      ${historyContext || 'No previous interactions.'}
      
      INSTRUCTIONS:
      Respond in a ${preferences.tone} manner. Focus on ${preferences.focusArea}. 
      Reference specific tasks or notes if relevant.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${systemInstruction}\n\nUSER: ${prompt}`,
      });

      const assistantMessage: AiInteraction = {
        role: 'assistant',
        content: response.text || "No response generated.",
        timestamp: new Date().toISOString()
      };
      
      setHistory(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: AiInteraction = {
        role: 'assistant',
        content: "Error connecting to ERNDA Intelligence Core. Please check system status.",
        timestamp: new Date().toISOString()
      };
      setHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E1E1E3] font-sans selection:bg-[#F27D26]/30">
      {/* --- Sidebar --- */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-[#1F1F23] bg-[#0D0D0F] flex flex-col z-50">
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F27D26] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(242,125,38,0.4)] border border-white/10">
              <span className="text-xl font-bold text-black font-serif">E</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tighter uppercase italic leading-none">ERNDA</h1>
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] opacity-40 mt-1">Intelligence Core</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            shortcut="01"
          />
          <NavButton 
            active={activeTab === 'tasks'} 
            onClick={() => setActiveTab('tasks')}
            icon={<CheckSquare size={18} />}
            label="Tasks"
            shortcut="02"
          />
          <NavButton 
            active={activeTab === 'notes'} 
            onClick={() => setActiveTab('notes')}
            icon={<BookOpen size={18} />}
            label="Knowledge"
            shortcut="03"
          />
          <NavButton 
            active={activeTab === 'ai'} 
            onClick={() => setActiveTab('ai')}
            icon={<Zap size={18} />}
            label="Intelligence"
            shortcut="04"
          />
        </nav>

        <div className="p-4 border-t border-[#1F1F23]">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[#151518] border border-[#1F1F23]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">System Online</span>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="pl-64 min-h-screen">
        <header className="h-16 border-bottom border-[#1F1F23] flex items-center justify-between px-8 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">Session // 2026.03.12</span>
            <div className="h-4 w-[1px] bg-[#1F1F23]" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">User // hamodealzager12</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#1F1F23] rounded-md transition-colors opacity-60 hover:opacity-100">
              <Search size={18} />
            </button>
            <button className="p-2 hover:bg-[#1F1F23] rounded-md transition-colors opacity-60 hover:opacity-100">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Active Tasks" value={tasks.filter(t => t.status !== 'completed').length} icon={<Clock className="text-[#F27D26]" />} />
                  <StatCard label="Knowledge Nodes" value={notes.length} icon={<BookOpen className="text-blue-400" />} />
                  <StatCard label="System Uptime" value="99.9%" icon={<Zap className="text-emerald-400" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-mono uppercase tracking-[0.3em] opacity-50">Priority Queue</h2>
                      <button onClick={() => setActiveTab('tasks')} className="text-[10px] uppercase tracking-widest hover:text-[#F27D26] transition-colors">View All</button>
                    </div>
                    <div className="space-y-3">
                      {sortedTasks.slice(0, 4).map(task => (
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-mono uppercase tracking-[0.3em] opacity-50">Recent Intelligence</h2>
                      <button onClick={() => setActiveTab('notes')} className="text-[10px] uppercase tracking-widest hover:text-[#F27D26] transition-colors">Browse</button>
                    </div>
                    <div className="space-y-3">
                      {notes.slice(0, 3).map(note => (
                        <div key={note.id} className="p-4 rounded-xl bg-[#0D0D0F] border border-[#1F1F23] hover:border-[#F27D26]/30 transition-all group cursor-pointer">
                          <h3 className="text-sm font-medium mb-1 group-hover:text-[#F27D26] transition-colors">{note.title}</h3>
                          <p className="text-xs text-[#8E9299] line-clamp-2 leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </motion.div>
            )}

            {activeTab === 'tasks' && (
              <motion.div 
                key="tasks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight italic serif">Task Management</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 p-1 bg-[#0D0D0F] border border-[#1F1F23] rounded-lg">
                      <button 
                        onClick={() => {
                          if (taskSortBy === 'priority') setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setTaskSortBy('priority'); setTaskSortOrder('desc'); }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded text-[10px] uppercase tracking-widest transition-all",
                          taskSortBy === 'priority' ? "bg-[#F27D26] text-black font-bold" : "text-[#8E9299] hover:text-[#E1E1E3]"
                        )}
                      >
                        Priority {taskSortBy === 'priority' && (taskSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                      <button 
                        onClick={() => {
                          if (taskSortBy === 'createdAt') setTaskSortOrder(taskSortOrder === 'asc' ? 'desc' : 'asc');
                          else { setTaskSortBy('createdAt'); setTaskSortOrder('desc'); }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded text-[10px] uppercase tracking-widest transition-all",
                          taskSortBy === 'createdAt' ? "bg-[#F27D26] text-black font-bold" : "text-[#8E9299] hover:text-[#E1E1E3]"
                        )}
                      >
                        Date {taskSortBy === 'createdAt' && (taskSortOrder === 'asc' ? '↑' : '↓')}
                      </button>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#F27D26] text-black rounded-lg font-bold text-sm hover:bg-[#F27D26]/90 transition-all shadow-[0_0_20px_rgba(242,125,38,0.2)]">
                      <Plus size={18} />
                      New Task
                    </button>
                  </div>
                </div>
                <div className="grid gap-3">
                  {sortedTasks.map(task => (
                    <TaskItem key={task.id} task={task} detailed />
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div 
                key="notes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold tracking-tight italic serif">Knowledge Base</h2>
                  <button className="flex items-center gap-2 px-4 py-2 border border-[#1F1F23] rounded-lg font-bold text-sm hover:bg-[#1F1F23] transition-all">
                    <Plus size={18} />
                    New Node
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.map(note => (
                    <div key={note.id} className="p-6 rounded-2xl bg-[#0D0D0F] border border-[#1F1F23] hover:border-[#F27D26]/50 transition-all space-y-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-bold">{note.title}</h3>
                        <div className="flex gap-2">
                          {note.tags.map(tag => (
                            <span key={tag} className="text-[9px] uppercase tracking-widest px-2 py-1 bg-[#1F1F23] rounded text-[#8E9299]">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-[#8E9299] leading-relaxed">{note.content}</p>
                      <div className="pt-4 border-t border-[#1F1F23] flex items-center justify-between text-[10px] font-mono opacity-40">
                        <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[calc(100vh-12rem)] flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={18} className="text-[#F27D26]" />
                    <h2 className="text-xl font-bold italic serif">Intelligence Core</h2>
                  </div>
                  <button 
                    onClick={() => setShowTuning(!showTuning)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest transition-all border",
                      showTuning ? "bg-[#F27D26] text-black border-[#F27D26]" : "bg-[#151518] text-[#8E9299] border-[#1F1F23] hover:border-[#F27D26]/50"
                    )}
                  >
                    <Settings size={14} />
                    Fine-Tune Behavior
                  </button>
                </div>

                <AnimatePresence>
                  {showTuning && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <div className="p-6 rounded-2xl bg-[#0D0D0F] border border-[#F27D26]/30 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Response Tone</label>
                          <select 
                            value={preferences.tone}
                            onChange={(e) => setPreferences(prev => ({ ...prev, tone: e.target.value as any }))}
                            className="w-full bg-[#151518] border border-[#1F1F23] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#F27D26]"
                          >
                            <option value="professional">Professional</option>
                            <option value="casual">Casual</option>
                            <option value="concise">Concise</option>
                            <option value="detailed">Detailed</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Primary Focus</label>
                          <input 
                            type="text"
                            value={preferences.focusArea}
                            onChange={(e) => setPreferences(prev => ({ ...prev, focusArea: e.target.value }))}
                            placeholder="e.g. Project Management"
                            className="w-full bg-[#151518] border border-[#1F1F23] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#F27D26]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Memory Depth ({preferences.memoryDepth})</label>
                          <input 
                            type="range"
                            min="1"
                            max="20"
                            value={preferences.memoryDepth}
                            onChange={(e) => setPreferences(prev => ({ ...prev, memoryDepth: parseInt(e.target.value) }))}
                            className="w-full accent-[#F27D26]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4 custom-scrollbar">
                  {history.length === 0 && !isAiLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                      <Terminal size={48} />
                      <div className="space-y-1">
                        <p className="text-sm font-mono uppercase tracking-widest">ERNDA Intelligence Core</p>
                        <p className="text-xs">System ready. Contextual memory active ({preferences.memoryDepth} turns).</p>
                      </div>
                    </div>
                  )}

                  {history.map((msg, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-6 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2",
                        msg.role === 'user' 
                          ? "bg-[#151518] border-[#1F1F23] ml-12" 
                          : "bg-[#0D0D0F] border-[#1F1F23] mr-12"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {msg.role === 'assistant' ? (
                            <Zap size={14} className="text-[#F27D26]" />
                          ) : (
                            <MessageSquare size={14} className="text-blue-400" />
                          )}
                          <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">
                            {msg.role === 'assistant' ? 'ERNDA CORE' : 'USER'}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono opacity-30">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm leading-relaxed text-[#E1E1E3] whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex items-center gap-3 text-[#F27D26] animate-pulse ml-2">
                      <Zap size={16} className="animate-spin" />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Processing Query...</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), askAi())}
                    placeholder="Query the system..."
                    className="w-full bg-[#0D0D0F] border border-[#1F1F23] rounded-2xl p-4 pr-16 text-sm focus:outline-none focus:border-[#F27D26] transition-all resize-none h-24"
                  />
                  <button 
                    onClick={askAi}
                    disabled={isAiLoading || !prompt.trim()}
                    className="absolute right-4 bottom-4 p-2 bg-[#F27D26] text-black rounded-xl hover:bg-[#F27D26]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare size={20} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Subcomponents ---

function NavButton({ active, onClick, icon, label, shortcut }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, shortcut: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group",
        active ? "bg-[#1F1F23] text-white" : "text-[#8E9299] hover:bg-[#151518] hover:text-[#E1E1E3]"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("transition-colors", active ? "text-[#F27D26]" : "group-hover:text-[#F27D26]")}>
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-[9px] font-mono opacity-30 group-hover:opacity-60 transition-opacity">{shortcut}</span>
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-[#0D0D0F] border border-[#1F1F23] flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
      <div className="p-3 rounded-xl bg-[#151518] border border-[#1F1F23]">
        {icon}
      </div>
    </div>
  );
}

function TaskItem({ task, detailed }: { task: Task, detailed?: boolean }) {
  const priorityColor = {
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className={cn(
      "p-4 rounded-xl bg-[#0D0D0F] border border-[#1F1F23] flex items-center gap-4 group hover:border-[#F27D26]/30 transition-all",
      task.status === 'completed' && "opacity-50"
    )}>
      <button className={cn(
        "w-5 h-5 rounded border flex items-center justify-center transition-all",
        task.status === 'completed' ? "bg-[#F27D26] border-[#F27D26]" : "border-[#1F1F23] hover:border-[#F27D26]"
      )}>
        {task.status === 'completed' && <CheckSquare size={12} className="text-black" />}
      </button>
      
      <div className="flex-1">
        <h4 className={cn("text-sm font-medium", task.status === 'completed' && "line-through")}>{task.title}</h4>
        {detailed && task.description && <p className="text-xs text-[#8E9299] mt-1">{task.description}</p>}
      </div>

      <div className="flex items-center gap-3">
        <span className={cn("text-[9px] uppercase tracking-widest px-2 py-1 rounded border font-bold", priorityColor[task.priority])}>
          {task.priority}
        </span>
        {detailed && <span className="text-[10px] font-mono opacity-30">{new Date(task.createdAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
