'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  priority: 'Critical' | 'High' | 'Medium';
  completed: boolean;
  radius: number;
}

interface ProjectViewProps {
  project: any;
  onBack: () => void;
}

export default function ProjectView({ project, onBack }: ProjectViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<TaskNode[]>([
    { id: 't1', title: 'Setup Database', priority: 'Critical', completed: false, radius: 50 },
    { id: 't2', title: 'Design API', priority: 'High', completed: false, radius: 45 },
    { id: 't3', title: 'Write Tests', priority: 'Medium', completed: false, radius: 40 },
    { id: 't4', title: 'Deploy Staging', priority: 'High', completed: false, radius: 45 },
    { id: 't5', title: 'Update Docs', priority: 'Medium', completed: false, radius: 40 },
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const initialNodes = tasks.map(t => ({
      ...t,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height - 100 - Math.random() * 100, // Start near the bottom
    }));

    const getBuoyancy = (priority: string) => {
      // Critical goes highest, then High, then Medium
      if (priority === 'Critical') return -0.06;
      if (priority === 'High') return -0.04;
      return -0.02;
    };

    const getTargetY = (priority: string, height: number) => {
      if (priority === 'Critical') return height * 0.15; // Top
      if (priority === 'High') return height * 0.4;   // Middle
      return height * 0.7;                            // Bottom
    };

    const simulation = d3.forceSimulation<TaskNode>(initialNodes)
      .force('charge', d3.forceManyBody().strength(-80))
      .force('collide', d3.forceCollide().radius((d: any) => d.radius + 5).iterations(2))
      .force('x', d3.forceX(width / 2).strength(0.01)) // Gentle pull to center horizontally
      .force('y', d3.forceY((d: any) => getTargetY(d.priority, height)).strength((d: any) => Math.abs(getBuoyancy(d.priority))))
      .on('tick', () => {
        // Constrain to boundaries
        const nodes = simulation.nodes();
        for (let node of nodes) {
          node.x = Math.max(node.radius, Math.min(width - node.radius, node.x || 0));
          node.y = Math.max(node.radius, Math.min(height - node.radius, node.y || 0));
        }
        setTasks([...nodes]);
      });

    return () => { simulation.stop(); };
  }, [tasks.length]); // Re-run slightly when tasks change (e.g. popped)

  const handlePop = (task: TaskNode) => {
    if (task.completed) return;
    
    // Confetti effect at balloon position
    if (containerRef.current && task.x && task.y) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (task.x + rect.left) / window.innerWidth;
      const y = (task.y + rect.top) / window.innerHeight;
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x, y },
        colors: ['#3b82f6', '#8b5cf6', '#ec4899']
      });
    }

    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'Critical') return 'bg-gradient-to-br from-rose-400 to-red-600';
    if (priority === 'High') return 'bg-gradient-to-br from-amber-400 to-orange-500';
    return 'bg-gradient-to-br from-blue-400 to-indigo-500';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 relative">
      <div className="absolute inset-0 bg-slate-800 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
      
      <header className="p-6 flex items-center gap-4 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{project.label}</h2>
          <p className="text-slate-400 text-sm">Pop balloons to complete tasks. Higher priority floats to the top.</p>
        </div>
      </header>

      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => handlePop(task)}
            className={`absolute rounded-full flex flex-col items-center justify-center text-center cursor-pointer shadow-2xl transition-transform hover:scale-110 active:scale-95 ${getPriorityColor(task.priority)} border-2 border-white/20 z-20`}
            style={{
              width: task.radius * 2,
              height: task.radius * 2,
              left: (task.x || 0) - task.radius,
              top: (task.y || 0) - task.radius,
              boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.2), inset 5px 5px 15px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* Balloon knot */}
            <div className="absolute -bottom-2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-white/50 rotate-180"></div>
            {/* Balloon string */}
            <div className="absolute -bottom-16 w-px h-16 bg-gradient-to-b from-white/30 to-transparent"></div>
            
            <div className="p-2 z-10">
              <p className="font-bold text-white drop-shadow-md text-sm leading-tight">
                {task.title}
              </p>
              <span className="text-[10px] uppercase font-black tracking-wider text-white/80 bg-black/20 rounded-full px-2 py-0.5 mt-1 inline-block border border-white/10">
                {task.priority}
              </span>
            </div>
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-400">
            <CheckCircle2 size={64} className="text-emerald-500 mb-4 opacity-50" />
            <p className="text-xl font-medium">All tasks popped!</p>
          </div>
        )}
      </div>
    </div>
  );
}
