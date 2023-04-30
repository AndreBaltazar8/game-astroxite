import * as pixi from "pixi.js";
import { viewport } from "../pixi";
import { iconButton } from "./button";

export class GWindow {
  container: pixi.Container;
  parent: GWindow | null = null;
  children: GWindow[] = [];
  closeButton: pixi.Graphics;
  updateContainer: (options: {
    drawBackground: (w: number, h: number) => void;
  }) => void;
  drawBox: (w: number, height: number) => void;
  constructor(
    container: pixi.Container,
    updateContainer: (options: {
      drawBackground: (w: number, height: number) => void;
    }) => void
  ) {
    this.container = container;
    this.updateContainer = updateContainer;
    // add close button
    this.closeButton = iconButton(() => {
      this.destroy();
    }, "close");
    this.container.addChild(this.closeButton);
    const boxGraphics = new pixi.Graphics();
    this.drawBox = (w: number, h: number) => {
      boxGraphics.clear();
      boxGraphics.beginFill(0x111111);
      boxGraphics.drawRect(0, 0, w, h);
      boxGraphics.endFill();
      boxGraphics.lineStyle(2, 0xffffff);
      boxGraphics.drawRect(0, 0, w, h);
      this.closeButton.position = new pixi.Point(w - 24, -8);
    };
    this.container.addChildAt(boxGraphics, 0);
  }

  addChild(child: GWindow) {
    this.children.push(child);
    child.parent = this;
    this.container.addChild(child.container);
  }

  update() {
    this.updateContainer({
      drawBackground: this.drawBox,
    });
    let accHeight = 0;
    this.children.forEach((child) => {
      child.update();
      child.container.position = new pixi.Point(
        this.container.x + this.container.width + 8,
        this.container.y + accHeight
      );
      accHeight += child.container.height + 8;
    });
  }

  clearChildren() {
    this.children.forEach((child) => child.destroy());
    this.children = [];
  }

  removeChild(child: GWindow) {
    this.children = this.children.filter((c) => c != child);
    this.container.removeChild(child.container);
  }

  destroy() {
    this.parent?.removeChild(this);
    this.children.forEach((child) => child.destroy());
    this.container.destroy();
  }
}

const windows: GWindow[] = [];
function addWindow(window: GWindow) {
  windows.push(window);
  viewport.addChild(window.container);
}
function removeWindow(window: GWindow) {
  windows.splice(windows.indexOf(window), 1);
  viewport.removeChild(window.container);
  window.destroy();
}
