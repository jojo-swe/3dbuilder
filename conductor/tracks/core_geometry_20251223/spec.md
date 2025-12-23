# Specification: Core Geometry Engine

## Overview
Implement the core domain logic for wall representation and automatic room detection. This is the foundation of the house builder, ensuring that user-drawn walls are correctly interpreted as physical spaces.

## Core Requirements
- **Wall Representation:** Walls defined by start and end points (centerline) with thickness and height metadata.
- **Wall Snapping:** Logic to ensure walls connect precisely at endpoints.
- **Intersection Detection:** Identify when walls intersect or overlap.
- **Room Detection:** Automatically identify closed loops of walls and generate `Room` objects.
- **Area Calculation:** Deterministic calculation of room area based on the inner boundary of connected walls.

## Technical Constraints
- Use pure TypeScript in `src/core/domain` and `src/core/geometry`.
- No dependencies on UI or Rendering layers.
- Must handle precision and tolerances (floating point math).

## Success Criteria
- Given a set of connected walls forming a rectangle, the system identifies one room.
- The area of the room matches the expected mathematical area (accounting for wall thickness).
- Complex wall configurations (T-junctions, nested loops) are handled correctly.
