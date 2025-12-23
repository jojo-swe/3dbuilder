import React from 'react';
import type { ToolType } from '../../core/state/store';
import { useEditorStore } from '../../core/state/store';
import { MousePointer2, Hammer, Square, Layers, Save, DoorOpen } from 'lucide-react';

export const Toolbar: React.FC = () => {
  const activeTool = useEditorStore(state => state.activeTool);
  const setTool = useEditorStore(state => state.setTool);
  const createProject = useEditorStore(state => state.createProject);

  const tools: { id: ToolType; icon: React.ElementType<{ size?: number | string }>; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'wall', icon: Hammer, label: 'Wall' },
    { id: 'room', icon: Square, label: 'Room' },
    { id: 'opening', icon: DoorOpen, label: 'Opening' },
  ];

  return (
    <div className="toolbar">
      <div className="mb-4">
        <button className="toolbar-btn active">
          <Layers size={24} />
        </button>
      </div>
      
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id)}
          className={`toolbar-btn ${activeTool === tool.id ? 'active' : ''}`}
          title={tool.label}
        >
          <tool.icon size={20} />
          <span className="sr-only">{tool.label}</span>
        </button>
      ))}

      <div style={{ borderTop: '1px solid #e5e7eb', width: '32px', margin: '8px 0' }} />

      <button onClick={() => createProject()} className="toolbar-btn" title="New Project">
        <Save size={20} />
      </button>
    </div>
  );
};
