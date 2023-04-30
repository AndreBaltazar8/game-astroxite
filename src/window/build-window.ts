import { iconButton } from "../components/button";
import { GWindow } from "../components/gwindow";
import { drawList } from "../components/list";
import { addWindow } from "../components/windows";
import { BodyType, CelestialBody, products } from "../game";
import * as pixi from "pixi.js";
import { playBuild } from "../sounds";
import { notifyError } from "../pixi";

export default function displayBuildWindow(
  body: CelestialBody,
  parentWindow: GWindow
) {
  const windowContainer = new pixi.Container();

  // Draw window title
  const titleGraphics = new pixi.Text("Build", {
    fill: 0xffffff,
    fontSize: 20,
  });
  titleGraphics.position = new pixi.Point(16, 16);
  windowContainer.addChild(titleGraphics);

  let options: {
    key: string;
    label: string;
    action: () => void;
  }[];
  let updateList: () => void;
  function buildOptions() {
    options = [
      {
        key: "ship",
        label: "Ship (300 iron)",
        action: () => {
          try {
            body.buildShip();
            playBuild();
            buildOptions();
            updateList();
          } catch (e) {
            notifyError(e.message);
          }
        },
      },
      body.type != BodyType.Station
        ? {
            key: "station",
            label: "Station (10000 iron)",
            action: () => {
              try {
                body.buildStation();
                playBuild();
                buildOptions();

                updateList();
              } catch (e) {
                notifyError(e.message);
              }
            },
          }
        : null,
    ].filter((option) => option != null) as any;

    if (body.type == BodyType.Planet || body.type == BodyType.Moon) {
      // more build options (factories, etc.)
      if (body.factories.every((f) => f.product !== products.water)) {
        options.push({
          key: "water",
          label: "Water factory (1000 coins)",
          action: () => {
            try {
              body.buildFactory({ product: products.water });
              playBuild();
              buildOptions();
              updateList();
            } catch (e) {
              notifyError(e.message);
            }
          },
        });
      }

      if (body.factories.every((f) => f.product !== products.iron)) {
        options.push({
          key: "iron",
          label: "Iron factory (1000 coins)",
          action: () => {
            try {
              body.buildFactory({ product: products.iron });
              playBuild();
              buildOptions();
              updateList();
            } catch (e) {
              notifyError(e.message);
            }
          },
        });
      }

      if (body.factories.every((f) => f.product !== products.carbon)) {
        options.push({
          key: "coal",
          label: "Coal mine (1000 coins)",
          action: () => {
            try {
              body.buildFactory({ product: products.carbon });
              playBuild();
              buildOptions();
              updateList();
            } catch (e) {
              notifyError(e.message);
            }
          },
        });
      }
    }
  }
  buildOptions();

  // Draw list of options do build
  const { container, update } = drawList(
    () => options,
    ({ key, label, action }) => {
      const container = new pixi.Container();
      const background = new pixi.Graphics();
      container.addChild(background);

      const button = iconButton(() => {
        action();
      }, "build");
      button.position = new pixi.Point(0, 0);
      container.addChild(button);

      const title = new pixi.Text(label, {
        fill: 0xffffff,
        fontSize: 16,
      });
      title.position = new pixi.Point(40, 4);
      container.addChild(title);

      background.beginFill(0x000000, 0.5);
      background.drawRect(0, 0, title.width + 16, title.height + 16);
      background.endFill();

      return { entry: container, update: () => {} };
    }
  );
  updateList = update;
  container.position = new pixi.Point(
    16,
    titleGraphics.y + titleGraphics.height + 16
  );
  windowContainer.addChild(container);

  // create window
  const window = new GWindow(windowContainer, ({ drawBackground }) => {
    drawBackground(300, container.y + container.height + 16);
  });
  parentWindow.clearChildren();
  parentWindow.addChild(window);
  addWindow(window);
}
