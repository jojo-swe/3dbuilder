export type EntityId = string;

export interface Node {
  id: EntityId;
  x: number;
  y: number;
}

export type MaterialType = 'plaster_white' | 'brick_red' | 'wood_panel';

export interface Wall {
  id: EntityId;
  startNodeId: EntityId;
  endNodeId: EntityId;
  thickness: number; // meters
  height: number;    // meters
  material?: MaterialType;
}

export interface Room {
  id: EntityId;
  name: string;
  boundaryWallIds: EntityId[]; // Ordered list of wall IDs forming the loop
  floorId: EntityId;
}

export interface Floor {
  id: EntityId;
  name: string;     // e.g., "Ground Floor"
  levelIndex: number; // 0, 1, 2...
  elevation: number; // Height from ground
  wallIds: EntityId[];
  roomIds: EntityId[];
}

import type { BygglovData } from './Bygglov';

export interface Project {
  id: EntityId;
  name: string;
  nodes: Record<EntityId, Node>;
  walls: Record<EntityId, Wall>;
  rooms: Record<EntityId, Room>;
  openings: Record<EntityId, Opening>;
  floors: Record<EntityId, Floor>;
  version: string;
  
  // Extension data
  bygglov?: BygglovData;
}

export type OpeningType = 'window' | 'door';

export interface Opening {
  id: EntityId;
  wallId: EntityId;
  distFromStart: number; // meters from startNode
  width: number; // meters
  height: number; // meters
  altitude: number; // meters from floor
  type: OpeningType;
}
