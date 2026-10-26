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
      <div className="inspector" style={{ color: '#6b7280' }}>
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
    <div className="inspector">
      <div>
        <h3 style={{ margin: 0 }}>Properties</h3>
        <span style={{ color: '#6b7280', fontSize: '0.75rem', fontFamily: 'monospace' }}>{id.slice(0, 8)}...</span>
      </div>

      <div>
        {/* Wall Properties */}
        {wall && (
          <div style={{ marginTop: '1rem' }}>
             <div style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Wall</div>
             
             <div className="inspector-field">
               <label htmlFor="wall-thick">Thickness (m)</label>
               <input 
                 id="wall-thick"
                 type="number" 
                 step="0.01"
                 className="inspector-input"
                 value={wall.thickness}
                 onChange={(e) => updateWall(id, { thickness: Number.parseFloat(e.target.value) })}
               />
             </div>

             <div className="inspector-field">
               <label htmlFor="wall-height">Height (m)</label>
               <input 
                 id="wall-height"
                 type="number" 
                 step="0.1"
                 className="inspector-input"
                 value={wall.height}
                 onChange={(e) => updateWall(id, { height: Number.parseFloat(e.target.value) })}
               />
             </div>

             <div className="inspector-field">
               <label htmlFor="wall-mat">Material</label>
               <select
                 id="wall-mat"
                 className="inspector-input"
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
          <div style={{ marginTop: '1rem' }}>
             <div style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Room</div>
             
             <div className="inspector-field">
               <label htmlFor="room-name">Name</label>
               <input 
                 id="room-name"
                 type="text" 
                 className="inspector-input"
                 value={room.name}
                 onChange={(e) => updateRoom(id, { name: e.target.value })}
               />
             </div>

             <div className="inspector-field">
               <span>Area</span>
               <div style={{ fontFamily: 'monospace' }}>
                   {area.toFixed(2)} m²
               </div>
             </div>

             {/* Bygglov Extension - Area Type */}
             <div className="inspector-field">
               <label htmlFor="room-type">Area Type</label>
               <select id="room-type" className="inspector-input" disabled>
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
