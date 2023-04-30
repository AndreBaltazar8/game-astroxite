import { viewport } from "../pixi";
import { GWindow } from "./gwindow";

export const windows: GWindow[] = [];
export function addWindow(window: GWindow) {
  windows.push(window);
  viewport.addChild(window.container);
}
export function removeWindow(window: GWindow) {
  windows.splice(windows.indexOf(window), 1);
  viewport.removeChild(window.container);
  window.destroy();
}
