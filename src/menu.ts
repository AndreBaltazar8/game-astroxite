import * as pixi from "pixi.js";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import { app } from "./pixi";
import { playShipSend } from "./sounds";

export function drawMainMenu({ onPlay }: { onPlay: () => void }) {
  const mainMenu = new pixi.Container();
  const mainMenuBackground = pixi.Sprite.from("assets/splash.jpg");
  const originalW = 4096;
  const originalH = 2560;
  const roundRect = new pixi.Graphics();
  const border = new pixi.Graphics();
  const title = new pixi.Text(
    `Astroxite`,
    new pixi.TextStyle({
      fill: 0xffffff,
      fontSize: 64,
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 8,
    })
  );
  const playBtn = new pixi.Graphics();
  const playText = new pixi.Text(
    `Play`,
    new pixi.TextStyle({
      fill: 0xffffff,
      fontSize: 32,
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 2,
    })
  );
  const author = new pixi.Text(
    `by MAT4DOR - @AndreBaltazar`,
    new pixi.TextStyle({
      fill: 0xffffff,
      fontSize: 16,
      fontWeight: "bold",
      dropShadow: true,
      dropShadowColor: 0x000000,
      dropShadowDistance: 2,
    })
  );

  mainMenuBackground.mask = roundRect;
  mainMenu.addChild(mainMenuBackground);
  mainMenu.addChild(border);
  mainMenu.filters = [new DropShadowFilter({ distance: 32, color: 0xffffff })];
  mainMenu.addChild(title);
  playBtn.filters = [new DropShadowFilter({ distance: 8, color: 0xffffff })];
  playBtn.eventMode = "static";
  playBtn.on("pointertap", () => {
    onPlay();
    playShipSend();
    app.stage.removeChild(overlay);
  });
  playText.eventMode = "none";
  playBtn.addChild(playText);
  mainMenu.addChild(playBtn);
  mainMenu.addChild(author);

  function draw() {
    const isLandScape = window.innerWidth > window.innerHeight;
    const sizeW = window.innerWidth * (isLandScape ? 0.8 : 0.9);
    const sizeH = window.innerHeight * (isLandScape ? 0.9 : 0.8);
    // make background cover the screen, but keep same aspect ratio
    const scale = Math.max(sizeW / originalW, sizeH / originalH);
    mainMenuBackground.scale = new pixi.Point(scale, scale);

    mainMenuBackground.position = new pixi.Point(
      window.innerWidth / 2 - sizeW / 2,
      window.innerHeight / 2 - sizeH / 2
    );
    roundRect.clear();
    roundRect.beginFill(0x000000, 0.5);
    roundRect.drawRoundedRect(
      window.innerWidth / 2 - sizeW / 2,
      window.innerHeight / 2 - sizeH / 2,
      sizeW,
      sizeH,
      16
    );
    roundRect.endFill();
    // add border
    border.clear();
    border.lineStyle(4, 0xffffff);
    border.drawRoundedRect(
      window.innerWidth / 2 - sizeW / 2,
      window.innerHeight / 2 - sizeH / 2,
      sizeW,
      sizeH,
      16
    );

    title.position = new pixi.Point(
      window.innerWidth / 2 - title.width / 2,
      window.innerHeight / 2 - title.height / 2 - 64
    );

    // add play button
    playBtn.clear();
    playBtn.beginFill(0x000000, 0.5);
    playBtn.drawRoundedRect(
      window.innerWidth / 2 - 128,
      window.innerHeight / 2 + 64,
      256,
      64,
      16
    );
    playBtn.endFill();
    playText.position = new pixi.Point(
      window.innerWidth / 2 - playText.width / 2,
      window.innerHeight / 2 + 64 + 16
    );
    author.position = new pixi.Point(
      roundRect.x + roundRect.width - author.width - 16,
      roundRect.y + roundRect.height - author.height - 16
    );
  }

  draw();
  window.addEventListener("resize", draw);

  const overlay = new pixi.Graphics();
  overlay.beginFill(0x000000, 0.2);
  overlay.drawRect(0, 0, window.innerWidth, window.innerHeight);
  overlay.endFill();
  overlay.eventMode = "static";
  overlay.addChild(mainMenu);
  app.stage.addChild(overlay);
}
