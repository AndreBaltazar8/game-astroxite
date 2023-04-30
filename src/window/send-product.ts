import { iconButton } from "../components/button";
import { GWindow } from "../components/gwindow";
import { drawList } from "../components/list";
import { addWindow } from "../components/windows";
import game, { CelestialBody, Product, convertDistance } from "../game";
import * as pixi from "pixi.js";
import { Howl } from "howler";
import { playShipSend } from "../sounds";
import { notifyError } from "../pixi";

export default function displaySendWindow(
  body: CelestialBody,
  product: Product | null,
  parentWindow: GWindow
) {
  const { container, update } = drawList(
    () => {
      const otherBodies = game.bodies.filter((b) => b.name != body.name);
      // sort by distance
      otherBodies.sort((a, b) => {
        const aDistance = Math.pow(a.x - body.x, 2) + Math.pow(a.y - body.y, 2);
        const bDistance = Math.pow(b.x - body.x, 2) + Math.pow(b.y - body.y, 2);
        return aDistance - bDistance;
      });
      return otherBodies.map((b) => ({
        key: b.name,
        toBody: b,
      }));
    },
    ({ toBody }) => {
      // draw entry for each body
      const entryContainer = new pixi.Container();
      const sendButton = iconButton((event) => {
        try {
          if (product == null) {
            const ships = event.shiftKey ? body.ships.length : 1;
            for (let i = 0; i < ships; i++) {
              game.sendEmptyShip(body, toBody);
            }
            if (ships == 0) {
              throw new Error("Not enough ships");
            }
          } else {
            const maxProduct = body.products.get(product) ?? 0;
            const ships = event.shiftKey
              ? Math.min(Math.floor(maxProduct / 100), body.ships.length)
              : 1;
            for (let i = 0; i < ships; i++) {
              game.sendProduct(body, toBody, product, 100);
            }
            if (ships == 0) {
              throw new Error("Not enough ships");
            }
          }
          playShipSend();
        } catch (e) {
          notifyError(e.message);
        }
      }, "send");
      const distance = toBody.distanceTo(body);

      if (
        distance > body.bestShipRange &&
        !game.hasRouteToWithShip(body, toBody)
      ) {
        sendButton.tint = 0xff0000;
      }
      sendButton.position = new pixi.Point(250, 0);
      const name = new pixi.Text(toBody.name, {
        fill: 0xffffff,
        fontSize: 10,
      });

      name.position = new pixi.Point(10, 4);
      const distanceText = new pixi.Text(
        `Distance: ${(distance / 400).toFixed(2)}au`,
        new pixi.TextStyle({ fill: 0xffffff, fontSize: 10 })
      );
      distanceText.position = new pixi.Point(10, 16);
      entryContainer.addChild(distanceText);

      entryContainer.addChild(sendButton);
      entryContainer.addChild(name);
      return {
        entry: entryContainer,
        update: () => {
          const distance = toBody.distanceTo(body);
          distanceText.text = `Distance: ${convertDistance(distance)}`;

          if (
            distance > body.bestShipRange &&
            !game.hasRouteToWithShip(body, toBody)
          ) {
            sendButton.tint = 0xff0000;
          } else {
            sendButton.tint = 0xffffff;
          }
        },
      };
    }
  );
  const windowContainer = new pixi.Container();

  // display product name
  const textGraphics = new pixi.Text(product?.name ?? "Empty", {
    fill: 0xffffff,
    fontSize: 20,
  });
  textGraphics.position = new pixi.Point(16, 16);
  container.position = new pixi.Point(0, textGraphics.height + 32);
  windowContainer.addChild(textGraphics);
  windowContainer.addChild(container);

  const window = new GWindow(windowContainer, ({ drawBackground }) => {
    update();
    drawBackground(300, textGraphics.height + container.height + 48);
  });
  parentWindow.clearChildren();
  parentWindow.addChild(window);
  addWindow(window);
}
