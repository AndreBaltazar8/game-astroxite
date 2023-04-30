import { iconButton } from "../components/button";
import { Dropdown } from "../components/dropdown";
import { GWindow } from "../components/gwindow";
import { drawList } from "../components/list";
import { addWindow, removeWindow } from "../components/windows";
import game, { CelestialBody, Product, convertDistance } from "../game";
import * as pixi from "pixi.js";

export default function displayFactoriesWindow(
  body: CelestialBody,
  parentWindow: GWindow
) {
  const windowContainer = new pixi.Container();

  // Draw window title
  const titleGraphics = new pixi.Text("Factories", {
    fill: 0xffffff,
    fontSize: 20,
  });
  titleGraphics.position = new pixi.Point(16, 16);
  windowContainer.addChild(titleGraphics);

  const { container, update } = drawList(
    () => {
      return body.factories.map((factory, index) => {
        return { key: index.toString(), factory };
      });
    },
    ({ key, factory }) => {
      const container = new pixi.Container();
      const background = new pixi.Graphics();
      container.addChild(background);

      const title = new pixi.Text(`Factory #${key}`, {
        fill: 0xffffff,
        fontSize: 16,
      });
      title.position = new pixi.Point(0, 0);
      container.addChild(title);

      // input
      const input = new pixi.Text(`Input:`, {
        fill: 0xffffff,
        fontSize: 16,
      });
      input.position = new pixi.Point(0, title.height + 4);
      container.addChild(input);

      function formatAmount(amount: number) {
        return amount < 1 ? amount.toFixed(2) : amount.toFixed(0);
      }

      let index = 0;
      factory.requires.forEach((amount, product) => {
        const text = new pixi.Text(
          `${product.name} (${formatAmount(amount)}/s)`,
          {
            fill: 0xffffff,
            fontSize: 16,
          }
        );
        text.position = new pixi.Point(
          0,
          input.y + input.height + 4 + index * 20
        );
        container.addChild(text);
        index++;
      });

      // output
      const output = new pixi.Text(`Produces:`, {
        fill: 0xffffff,
        fontSize: 16,
      });
      output.position = new pixi.Point(
        0,
        input.y + input.height + 4 + index * 20
      );
      container.addChild(output);
      const productText = new pixi.Text(
        `${factory.product.name} (${formatAmount(
          factory.currentProduction
        )}/s)`,
        {
          fill: 0xffffff,
          fontSize: 16,
        }
      );
      productText.position = new pixi.Point(0, output.y + output.height + 4);
      container.addChild(productText);

      background.beginFill(0xff0000);
      background.drawRect(0, 0, 0, container.height + 8);
      background.endFill();

      return { entry: container, update: () => {} };
    }
  );
  container.position = new pixi.Point(16, 40);
  windowContainer.addChild(container);

  // create window
  const window = new GWindow(windowContainer, ({ drawBackground }) => {
    update();
    drawBackground(
      Math.max(container.width + 32, 300),
      container.y + container.height + 16
    );
  });
  parentWindow.clearChildren();
  parentWindow.addChild(window);
  addWindow(window);
}
