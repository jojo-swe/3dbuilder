import React from 'react';
import { useEditorStore } from '../../core/state/store';
import { RoomUtils } from '../../core/domain/RoomUtils';
import { PolygonUtils } from '../../core/geometry/PolygonUtils';
import type { MaterialType } from '../../core/domain/types';

export const PropertyInspector: React.FC = () => {
  const selectedIds = useEditorStore(state => state.selectedIds);
  const project = useEditorStore(state => state.project);
  const updateWall = useEditorStore(state => state.updateWall);
  const updateRoom = useEditorStore(state => state.updateRoom);

  if (selectedIds.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-gray-200 p-4 text-sm text-gray-500">
        No selection
      </div>
    );
  }

  const id = selectedIds[0];
  const wall = project.walls[id];
  const room = project.rooms[id];

  // Calculate generic properties
  let area = 0;
  if (room) {
      const poly = RoomUtils.getPolygon(project, room);
      area = PolygonUtils.area(poly);
  }

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col shadow-sm z-10 overflow-auto">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Properties</h3>
        <span className="text-xs text-gray-500 font-mono">{id.slice(0, 8)}...</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Wall Properties */}
        {wall && (
          <div className="space-y-3">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wall</div>
             
             <div className="flex flex-col gap-1">
               <label htmlFor="wall-thick" className="text-sm font-medium text-gray-700">Thickness (m)</label>
               <input 
                 id="wall-thick"
                 type="number" 
                 step="0.01"
                 className="inspector-input"
                 value={wall.thickness}
                 onChange={(e) => updateWall(id, { thickness: Number.parseFloat(e.target.value) })}
               />
             </div>

             <div className="flex flex-col gap-1">
               <label htmlFor="wall-height" className="text-sm font-medium text-gray-700">Height (m)</label>
               <input 
                 id="wall-height"
                 type="number" 
                 step="0.1"
                 className="inspector-input"
                 value={wall.height}
                 onChange={(e) => updateWall(id, { height: Number.parseFloat(e.target.value) })}
               />
             </div>

             <div className="flex flex-col gap-1">
               <label htmlFor="wall-mat" className="text-sm font-medium text-gray-700">Material</label>
               <select
                 id="wall-mat"
                 className="inspector-input bg-white"
                 value={wall.material || 'plaster_white'}
                 onChange={(e) => {
                   const VALID_MATERIALS: MaterialType[] = ['plaster_white', 'brick_red', 'wood_panel'];
                   const val = e.target.value as MaterialType;
                   if (VALID_MATERIALS.includes(val)) updateWall(id, { material: val });
                 }}
               >
                  <option value="plaster_white">Plaster (White)</option>
                  <option value="brick_red">Brick (Red)</option>
                  <option value="wood_panel">Wood Panel</option>
               </select>
             </div>
          </div>
        )}

        {/* Room Properties */}
        {room && (
          <div className="space-y-3">
             <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room</div>
             
             <div className="flex flex-col gap-1">
               <label htmlFor="room-name" className="text-sm font-medium text-gray-700">Name</label>
               <input 
                 id="room-name"
                 type="text" 
                 className="inspector-input"
                 value={room.name}
                 onChange={(e) => updateRoom(id, { name: e.target.value })}
               />
             </div>

             <div className="flex flex-col gap-1">
               <span className="text-sm font-medium text-gray-700">Area</span>
               <div className="p-2 bg-gray-50 border border-gray-200 rounded text-gray-800 font-mono text-sm">
                   {area.toFixed(2)} m²
               </div>
             </div>

             {/* Bygglov Extension - Area Type */}
             <div className="flex flex-col gap-1">
               <label htmlFor="room-type" className="text-sm font-medium text-gray-700">Area Type</label>
               <select id="room-type" className="inspector-input bg-white" disabled>
                  <option value="BOA">BOA (Living Area)</option>
                  <option value="BIA">BIA (Auxiliary)</option>
               </select>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
