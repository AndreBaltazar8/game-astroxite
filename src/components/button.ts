import * as pixi from "pixi.js";
export function iconButton(
  onClick: (event: pixi.FederatedPointerEvent) => void,
  icon: string
) {
  const graphics = new pixi.Graphics();
  graphics.beginFill(0x000000);
  graphics.drawRect(0, 0, 32, 32);
  graphics.endFill();
  graphics.lineStyle(1, 0xffffff, 0.3);
  graphics.drawRect(0, 0, 32, 32);
  graphics.eventMode = "static";
  graphics.cursor = "pointer";
  graphics.on("pointertap", onClick);
  const sprite = pixi.Sprite.from(`assets/${icon}.png`);
  sprite.width = 32;
  sprite.height = 32;
  sprite.position = new pixi.Point(0, 0);
  graphics.addChild(sprite);
  return graphics;
}
