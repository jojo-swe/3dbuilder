import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Project, Wall, EntityId, Room, Opening } from '../domain/types';
import { v4 as uuidv4 } from 'uuid';
import { RoomFinder } from '../geometry/RoomFinder';

export type ToolType = 'select' | 'wall' | 'room' | 'opening';

interface EditorState {
  project: Project;
  selectedIds: EntityId[];
  activeTool: ToolType;
  snapGridSize: number; // meters
}

interface EditorActions {
  setTool: (tool: ToolType) => void;
  select: (ids: EntityId[]) => void;
  // Domain Actions
  addNode: (x: number, y: number) => EntityId;
  addWall: (startNodeId: EntityId, endNodeId: EntityId, floorId: EntityId) => EntityId;
  addOpening: (opening: Opening) => void;
  updateWall: (id: EntityId, updates: Partial<Wall>) => void;
  updateRoom: (id: EntityId, updates: Partial<Room>) => void;
  moveNode: (id: EntityId, x: number, y: number) => void;
  removeWall: (id: EntityId) => void;
  removeNode: (id: EntityId) => void;
  createProject: () => void;
}

const DEFAULT_WALL_THICKNESS = 0.2;
const DEFAULT_WALL_HEIGHT = 2.4;

export const useEditorStore = create<EditorState & EditorActions>()(
  immer((set) => ({
    project: {
      id: '',
      name: 'Untitled',
      nodes: {},
      walls: {},
      rooms: {},
      openings: {},
      floors: {},
      version: '1.0.0'
    },
    selectedIds: [],
    activeTool: 'select',
    snapGridSize: 0.1,

    setTool: (tool) => set((state) => { state.activeTool = tool; }),
    select: (ids) => set((state) => { state.selectedIds = ids; }),

    createProject: () => set((state) => {
       const initialFloorId = uuidv4();
       state.project = {
         id: uuidv4(),
         name: 'New House Project',
         version: '1.0.0',
         nodes: {},
         walls: {},
         rooms: {},
         openings: {},
         floors: {
           [initialFloorId]: {
             id: initialFloorId,
// ...
             name: 'Ground Floor',
             levelIndex: 0,
             elevation: 0,
             wallIds: [],
             roomIds: []
           }
         }
       };
    }),

    addNode: (x, y) => {
      const id = uuidv4();
      set((state) => {
        state.project.nodes[id] = { id, x, y };
      });
      return id;
    },

    addWall: (startNodeId, endNodeId, floorId) => {
      const id = uuidv4();
      set((state) => {
        const wall: Wall = {
            id,
            startNodeId,
            endNodeId,
            thickness: DEFAULT_WALL_THICKNESS,
            height: DEFAULT_WALL_HEIGHT
        };
        state.project.walls[id] = wall;
        state.project.floors[floorId].wallIds.push(id);
        
        // Auto-detect rooms
        // Ideally we only check the affected floor
        const floor = state.project.floors[floorId];
        const floorWalls: Record<EntityId, Wall> = {};
        floor.wallIds.forEach(wId => {
            if(state.project.walls[wId]) floorWalls[wId] = state.project.walls[wId];
        });

        const loops = RoomFinder.findRooms(state.project.nodes, floorWalls);
        
        // Rebuild rooms for this floor
        // 1. Remove old rooms associated with this floor from project.rooms
        const oldRoomIds = floor.roomIds;
        oldRoomIds.forEach(rId => {
            delete state.project.rooms[rId];
        });
        floor.roomIds = [];

        // 2. Create new rooms
        loops.forEach((wallIds, index) => {
            const roomId = uuidv4();
            const room: Room = {
                id: roomId,
                name: `Room ${index + 1}`,
                boundaryWallIds: wallIds,
                floorId: floor.id
            };
            state.project.rooms[roomId] = room;
            floor.roomIds.push(roomId);
        });
      });
      return id;
    },

    addOpening: (opening) => set((state) => {
        state.project.openings[opening.id] = opening;
    }),

    updateWall: (id, updates) => set((state) => {
      const wall = state.project.walls[id];
      if (wall) {
        Object.assign(wall, updates);
      }
    }),

    updateRoom: (id, updates) => set((state) => {
      const room = state.project.rooms[id];
      if (room) {
        Object.assign(room, updates);
      }
    }),

    moveNode: (id, x, y) => set((state) => {
      if (state.project.nodes[id]) {
        state.project.nodes[id].x = x;
        state.project.nodes[id].y = y;
      }
    }),

    removeWall: (id) => set((state) => {
        // Remove from walls
        delete state.project.walls[id];
        // Remove from floors
        Object.values(state.project.floors).forEach(floor => {
            const idx = floor.wallIds.indexOf(id);
            if(idx !== -1) floor.wallIds.splice(idx, 1);
        });
        // Note: Should also clean up rooms dependent on this wall
    }),

    removeNode: (id) => set((state) => {
        delete state.project.nodes[id];
        // Note: Should also remove attached walls?
    })
  }))
);
