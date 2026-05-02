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
        setNodes([...simulation.nodes()]);
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
          className={`absolute rounded-full flex items-center justify-center text-center cursor-pointer shadow-xl transition-transform hover:scale-105 border-2 border-white/20 backdrop-blur-md ${node.type === 'project' ? 'z-10' : 'z-20'}`}
          style={{
            width: node.radius * 2,
            height: node.radius * 2,
            left: (node.x || 0) - node.radius,
            top: (node.y || 0) - node.radius,
            backgroundColor: node.color,
            boxShadow: `0 0 30px ${node.color}40, inset 0 0 20px rgba(255,255,255,0.2)`
          }}
        >
          <div className="p-4">
            <p className={`font-bold text-white drop-shadow-md ${node.type === 'project' ? 'text-xl' : 'text-sm'}`}>
              {node.label}
            </p>
            {node.type === 'project' && (
              <p className="text-white/80 text-xs mt-1 font-medium bg-black/20 rounded-full px-2 py-1">
                Click to enter
              </p>
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
