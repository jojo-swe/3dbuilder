// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { useEditorStore } from '../../core/state/store';
import { FloorPlanEditor } from './FloorPlanEditor';

function addSelectedWall(): string {
  const store = useEditorStore.getState();
  const a = store.addNode(0, 0);
  const b = store.addNode(4, 0);
  const floorId = Object.keys(useEditorStore.getState().project.floors)[0];
  const wallId = store.addWall(a, b, floorId);
  store.select([wallId]);
  return wallId;
}

describe('FloorPlanEditor delete key', () => {
  beforeEach(() => {
    useEditorStore.getState().createProject();
    useEditorStore.getState().setTool('select');
  });
  afterEach(cleanup);

  it.each(['Delete', 'Backspace'])('%s removes the selected wall and clears the selection', key => {
    const wallId = addSelectedWall();
    render(<FloorPlanEditor />);

    fireEvent.keyDown(window, { key });

    const state = useEditorStore.getState();
    expect(state.project.walls[wallId]).toBeUndefined();
    expect(state.selectedIds).toEqual([]);
  });

  it('ignores Backspace typed into an input field', () => {
    const wallId = addSelectedWall();
    render(<><FloorPlanEditor /><input aria-label="field" /></>);
    const input = document.querySelector('input');
    if (!input) throw new Error('input not rendered');

    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(useEditorStore.getState().project.walls[wallId]).toBeDefined();
  });

  it('does nothing outside the select tool', () => {
    const wallId = addSelectedWall();
    useEditorStore.getState().setTool('wall');
    render(<FloorPlanEditor />);

    fireEvent.keyDown(window, { key: 'Delete' });

    expect(useEditorStore.getState().project.walls[wallId]).toBeDefined();
  });
});
