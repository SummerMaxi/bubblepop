'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { useAuth } from '@/lib/AuthContext';
import ProjectView from './ProjectView';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  type: 'user' | 'project';
  label: string;
  radius: number;
  color: string;
  projectId?: string;
}

const mockNodes: Node[] = [
  { id: 'p1', type: 'project', label: 'Website Revamp', radius: 80, color: 'rgb(99 102 241)' },
  { id: 'p2', type: 'project', label: 'Core Infrastructure', radius: 100, color: 'rgb(168 85 247)' },
  { id: 'u1', type: 'user', label: 'Alice', radius: 40, color: 'rgb(56 189 248)', projectId: 'p1' },
  { id: 'u2', type: 'user', label: 'Bob', radius: 40, color: 'rgb(56 189 248)', projectId: 'p1' },
  { id: 'u3', type: 'user', label: 'Charlie', radius: 40, color: 'rgb(56 189 248)', projectId: 'p2' },
  { id: 'u4', type: 'user', label: 'Dave', radius: 40, color: 'rgb(56 189 248)', projectId: 'p2' },
  { id: 'u5', type: 'user', label: 'Eve', radius: 40, color: 'rgb(56 189 248)', projectId: 'p2' },
];

export default function BubbleMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>(mockNodes);
  const [activeProject, setActiveProject] = useState<Node | null>(null);

  useEffect(() => {
    if (!containerRef.current || activeProject) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Initialize positions randomly within container
    const initialNodes = nodes.map(n => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const simulation = d3.forceSimulation<Node>(initialNodes)
      .force('charge', d3.forceManyBody().strength(-200)) // Repel each other
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05)) // Pull to center
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 10).iterations(2)) // Don't overlap
      .on('tick', () => {
        const nodesArr = simulation.nodes();
        for (let node of nodesArr) {
          node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x || 0));
          node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y || 0));
        }
        setNodes([...nodesArr]);
      });

    // Custom force: pull users towards their projects
    const groupingForce = (alpha: number) => {
      const nodesArr = simulation.nodes();
      const projectMap = new Map();
      nodesArr.filter(n => n.type === 'project').forEach(p => projectMap.set(p.id, p));

      for (let i = 0; i < nodesArr.length; i++) {
        const node = nodesArr[i];
        if (node.type === 'user' && node.projectId) {
          const project = projectMap.get(node.projectId);
          if (project) {
            // Pull user towards project
            const dx = (project.x || 0) - (node.x || 0);
            const dy = (project.y || 0) - (node.y || 0);
            node.x = (node.x || 0) + dx * alpha * 0.1;
            node.y = (node.y || 0) + dy * alpha * 0.1;
          }
        }
      }
    };
    
    simulation.force('grouping', groupingForce);

    return () => {
      simulation.stop();
    };
  }, [activeProject]);

  if (activeProject) {
    return <ProjectView project={activeProject} onBack={() => setActiveProject(null)} />;
  }

  return (
    <div className="w-full h-full relative bg-slate-900 overflow-hidden" ref={containerRef}>
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-slate-900 to-slate-900"></div>
      
      {nodes.map(node => (
        <div
          key={node.id}
          onClick={() => node.type === 'project' && setActiveProject(node)}
          className={`absolute rounded-full flex flex-col items-center justify-center text-center backdrop-blur-xl transition-all duration-300 border border-white/30 
            ${node.type === 'project' ? 'cursor-pointer z-10 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]' : 'cursor-default z-20'}
          `}
          style={{
            width: node.radius * 2,
            height: node.radius * 2,
            left: (node.x || 0) - node.radius,
            top: (node.y || 0) - node.radius,
            background: node.type === 'project' 
              ? `radial-gradient(circle at 30% 30%, ${node.color}, rgba(0,0,0,0.5))`
              : `linear-gradient(135deg, ${node.color}cc, rgba(255,255,255,0.1))`,
            boxShadow: node.type === 'project' 
              ? `0 10px 40px ${node.color}80, inset 0 2px 20px rgba(255,255,255,0.5)`
              : `0 4px 15px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.3)`
          }}
        >
          {node.type === 'project' && (
            <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>
          )}
          <div className="p-4 z-10 flex flex-col items-center justify-center h-full w-full">
            <p className={`font-bold text-white drop-shadow-lg tracking-wide ${node.type === 'project' ? 'text-2xl leading-tight' : 'text-sm'}`}>
              {node.label}
            </p>
            {node.type === 'project' && (
              <span className="text-white text-xs mt-2 font-semibold bg-white/20 backdrop-blur-md rounded-full px-3 py-1 uppercase tracking-widest border border-white/20">
                Open Project
              </span>
            )}
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-slate-400 font-medium text-sm bg-slate-800/80 inline-block px-4 py-2 rounded-full backdrop-blur-md">
          Bubbles automatically cluster around their projects. Click a project bubble to view tasks.
        </p>
      </div>
    </div>
  );
}
