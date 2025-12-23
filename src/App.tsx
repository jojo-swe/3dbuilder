import { useEffect } from 'react';
import { useEditorStore } from './core/state/store';
import { FloorPlanEditor } from './ui/editor/FloorPlanEditor';
import { PropertyInspector } from './ui/editor/PropertyInspector';
import { Viewport3D } from './ui/viewport/Viewport3D';
import { Toolbar } from './ui/editor/Toolbar';
import './index.css';

function App() {
  const createProject = useEditorStore(state => state.createProject);
  const project = useEditorStore(state => state.project);

  useEffect(() => {
    // Initialize project if empty (or just checking if we need to load one)
    if (!project.id) {
       createProject();
    }
  }, [createProject, project.id]);

  return (
    <div className="app-container font-sans text-gray-900">
      <Toolbar />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden h-full">
        {/* 2D Editor */}
        <div className="flex-1 border-r border-gray-200 relative flex flex-col min-w-0 min-h-0">
             <FloorPlanEditor />
        </div>
        
        {/* 3D Viewport */}
        <div className="flex-1 relative flex flex-col min-w-0 min-h-0">
             <Viewport3D />
        </div>

        {/* Inspector */}
        <div className="flex-none">
            <PropertyInspector />
        </div>
      </div>
    </div>
  );
};
export default App;
