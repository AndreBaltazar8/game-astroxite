import * as pixi from "pixi.js";
import { Viewport } from "pixi-viewport";
import { playError } from "./sounds";

export let app;
export let viewport: Viewport;
export let background: pixi.TilingSprite;
const errorContainer = new pixi.Container();
export function initPixi() {
  if (app) return;
  app = new pixi.Application({ background: 0x222222, autoDensity: true });

  document.body.appendChild(app.view as HTMLCanvasElement);

  app.renderer.resize(window.innerWidth, window.innerHeight);

  viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,

    events: app.renderer.events,
  });

  background = pixi.TilingSprite.from("assets/bg.png", {
    width: window.innerWidth,
    height: window.innerHeight,
  });

  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    viewport.resize(window.innerWidth, window.innerHeight, 1000, 1000);
    background.width = window.innerWidth;
    background.height = window.innerHeight;
  });

  app.stage.addChild(background);

  app.stage.addChild(viewport);

  app.stage.addChild(errorContainer);

  viewport.drag().pinch().wheel().decelerate();
}

export type RenderObject<T extends pixi.DisplayObject> = {
  obj: T;
  update: () => void;
};

const errorTimeouts: number[] = [];
const errorStack: pixi.Text[] = [];

function organizeErrorChildren() {
  let y = 0;
  for (const child of errorStack) {
    child.y = y;
    y += child.height;
  }
}

export function notifyError(error: any) {
  playError();
  const text = new pixi.Text(error.toString(), {
    fill: 0xff0000,
    fontSize: 20,
    fontWeight: "bold",
  });
  errorStack.push(text);
  errorContainer.addChild(text);
  if (errorStack.length > 5) {
    errorStack.shift()?.destroy();
    clearTimeout(errorTimeouts.shift());
  }
  organizeErrorChildren();
  errorTimeouts.push(
    setTimeout(() => {
      errorStack.shift()?.destroy();
      clearTimeout(errorTimeouts.shift());
      organizeErrorChildren();
    }, 5000)
  );
}
