'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle2, Circle } from 'lucide-react';

export default function AccessibleListView() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Design Landing Page', project: 'Website Revamp', priority: 'High', completed: false },
    { id: '2', title: 'Setup Firebase Auth', project: 'Core Infrastructure', priority: 'Critical', completed: false },
    { id: '3', title: 'Write Tests', project: 'Core Infrastructure', priority: 'Medium', completed: false }
  ]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white" tabIndex={0}>Your Projects & Tasks</h2>
          
          <div className="space-y-6">
            {/* Grouping by Project just to show structure visually similar to bubbles */}
            {Array.from(new Set(tasks.map(t => t.project))).map(projectName => (
              <div key={projectName} className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm">
                <h3 className="text-xl font-semibold mb-4 text-indigo-300" tabIndex={0}>
                  Project: {projectName}
                </h3>
                <ul className="space-y-3" role="list" aria-label={`Tasks for ${projectName}`}>
                  {tasks.filter(t => t.project === projectName).map(task => (
                    <li 
                      key={task.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        task.completed 
                          ? 'bg-slate-900/50 border-slate-800 opacity-50' 
                          : 'bg-slate-700 border-slate-600 hover:border-indigo-500'
                      }`}
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                        aria-label={task.completed ? `Mark ${task.title} as incomplete` : `Mark ${task.title} as complete`}
                        aria-pressed={task.completed}
                      >
                        {task.completed ? (
                          <CheckCircle2 className="text-emerald-400 w-6 h-6" />
                        ) : (
                          <Circle className="text-slate-400 w-6 h-6" />
                        )}
                      </button>
                      <div className="flex-1">
                        <span className={`font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          task.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          task.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
