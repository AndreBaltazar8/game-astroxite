import * as pixi from "pixi.js";
import { BodyType, CelestialBody } from "../game";
import { GWindow } from "../components/gwindow";
import { drawList } from "../components/list";
import { iconButton } from "../components/button";
import displaySendWindow from "./send-product";
import { addWindow } from "../components/windows";
import { app, viewport } from "../pixi";
import displayRouteWindow from "./router-menu";
import displayFactoriesWindow from "./factories-window";
import displayBuildWindow from "./build-window";
import { playStationMove } from "../sounds";

export default function drawInfoBox(body: CelestialBody, position: pixi.Point) {
  let gwindow: GWindow;
  const windowContainer = new pixi.Container();
  // Draw the name of the body
  const textGraphics = new pixi.Text(body.name, {
    fill: 0xffffff,
    fontSize: 20,
  });
  textGraphics.position = new pixi.Point(16, 16);
  windowContainer.addChild(textGraphics);

  // Draw number of ships
  const shipsGraphics = new pixi.Text(`Ships: ${body.ships.length}`, {
    fill: 0xffffff,
    fontSize: 16,
  });
  shipsGraphics.position = new pixi.Point(16, 44);
  windowContainer.addChild(shipsGraphics);

  // Send ship empty
  const sendShipEmptyButton = iconButton(() => {
    displaySendWindow(body, null, gwindow);
  }, "send");
  sendShipEmptyButton.position = new pixi.Point(
    textGraphics.x + textGraphics.width + 16,
    8
  );
  windowContainer.addChild(sendShipEmptyButton);

  // Create button to build window
  const buildWindowButton = iconButton(() => {
    displayBuildWindow(body, gwindow);
  }, "build");
  buildWindowButton.position = new pixi.Point(
    sendShipEmptyButton.x + sendShipEmptyButton.width + 16,
    8
  );
  windowContainer.addChild(buildWindowButton);

  // Create route products button
  const routeProducts = iconButton(() => {
    displayRouteWindow(body, gwindow);
  }, "router");
  routeProducts.position = new pixi.Point(
    buildWindowButton.x + buildWindowButton.width + 16,
    8
  );
  windowContainer.addChild(routeProducts);

  // Create a button to show factories window
  const factoriesButton = iconButton(() => {
    displayFactoriesWindow(body, gwindow);
  }, "factories");
  factoriesButton.position = new pixi.Point(
    routeProducts.x + routeProducts.width + 16,
    8
  );
  windowContainer.addChild(factoriesButton);

  if (body.type == BodyType.Station) {
    // build button to move station
    const moveStationButton = iconButton(() => {
      const overlay = new pixi.Graphics();
      overlay.beginFill(0xffffff, 0.5);
      overlay.drawRect(0, 0, window.innerWidth, window.innerHeight);
      overlay.endFill();
      overlay.eventMode = "static";
      overlay.on("pointertap", (event) => {
        app.stage.removeChild(overlay);
        overlay.destroy();
        const point = viewport.toWorld(event.page);
        playStationMove();
        body.target = { x: point.x, y: point.y };
      });

      // add overlay info
      const text = new pixi.Text(
        "Click on the map to move the station",
        new pixi.TextStyle({ fill: 0x000000 })
      );
      text.position = new pixi.Point(16, 16);
      overlay.addChild(text);

      app.stage.addChild(overlay);
    }, "move");
    moveStationButton.position = new pixi.Point(
      sendShipEmptyButton.x + sendShipEmptyButton.width + 16,
      -40
    );
    windowContainer.addChild(moveStationButton);
  }

  // Draw the products
  const { container: productsContainer, update: productsUpdate } = drawProducts(
    body,
    () => gwindow
  );
  windowContainer.addChild(productsContainer);

  productsContainer.position = new pixi.Point(
    16,
    textGraphics.height + 32 + shipsGraphics.height
  );

  windowContainer.position = position;
  gwindow = new GWindow(windowContainer, ({ drawBackground }) => {
    productsUpdate();
    shipsGraphics.text = `Ships: ${body.ships.length}`;
    drawBackground(
      textGraphics.width + 48 * 6,
      16 +
        textGraphics.height +
        shipsGraphics.height +
        16 +
        productsContainer.height +
        (productsContainer.height != 0 ? 16 : 0)
    );
  });
  addWindow(gwindow);
  body.data.dataContainer = gwindow;
}

function drawProducts(body: CelestialBody, getWindow: () => GWindow) {
  return drawList(
    () => {
      const products = Array.from(body.products.entries());
      return products
        .filter(([product, amount]) => amount > 0)
        .map(([product, amount]) => ({ key: product.name, product, amount }));
    },
    ({ product, amount }) => {
      const entryContainer = new pixi.Container();
      // background
      const graphics = new pixi.Graphics();
      entryContainer.addChild(graphics);

      const sendCargoButton = iconButton(() => {
        displaySendWindow(body, product, getWindow());
      }, "send");
      sendCargoButton.position = new pixi.Point(0, 4);
      entryContainer.addChild(sendCargoButton);
      const text = new pixi.Text(
        `${product.name}: ${amount.toFixed(2)}`,
        new pixi.TextStyle({ fill: 0xffffff, fontSize: 16, fontWeight: "bold" })
      );
      text.position = new pixi.Point(45, 12);
      entryContainer.addChild(text);

      graphics.beginFill(0x000000, 0);
      graphics.drawRect(-8, 2, 280, 38);
      graphics.endFill();
      return {
        entry: entryContainer,
        update: ({ product, amount }) => {
          text.text = `${product.name}: ${amount.toFixed(2)}`;
          entryContainer.removeChild(text);
          entryContainer.addChild(text);
        },
      };
    }
  );
}
