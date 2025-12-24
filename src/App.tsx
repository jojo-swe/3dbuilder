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
    if (!project.id) {
       createProject();
    }
  }, [createProject, project.id]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      {/* Left Toolbar - Fixed width */}
      <Toolbar />
      
      {/* Main Content Area - Split between 2D and 3D */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
      }}>
        {/* 2D Editor - Half of remaining space */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid #e5e7eb',
          minWidth: 0
        }}>
          <FloorPlanEditor />
        </div>
        
        {/* 3D Viewport - Half of remaining space */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0
        }}>
          <Viewport3D />
        </div>
      </div>
      
      {/* Right Inspector - Fixed width */}
      <PropertyInspector />
    </div>
  );
}

export default App;
