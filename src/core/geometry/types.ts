export interface Vector2 {
  x: number;
  y: number;
}

export interface LineSegment {
  start: Vector2;
  end: Vector2;
}

export type Polygon = Vector2[];

export const EPSILON = 0.0001;
