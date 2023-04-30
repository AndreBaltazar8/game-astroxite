import { iconButton } from "../components/button";
import { Dropdown } from "../components/dropdown";
import { GWindow } from "../components/gwindow";
import { drawList } from "../components/list";
import { addWindow, removeWindow } from "../components/windows";
import game, { CelestialBody, Product, convertDistance } from "../game";
import * as pixi from "pixi.js";

export default function displayRouteWindow(
  body: CelestialBody,
  parentWindow: GWindow
) {
  const windowContainer = new pixi.Container();

  // Draw window title
  const titleGraphics = new pixi.Text("Router", {
    fill: 0xffffff,
    fontSize: 20,
  });
  titleGraphics.position = new pixi.Point(16, 16);
  windowContainer.addChild(titleGraphics);

  // Draw route list

  const { container, update } = drawList(
    () => {
      return Array.from(body.pathTo.entries()).map(([body, route]) => {
        return { key: body.name, body, route };
      });
    },
    ({ body: toBody, route }) => {
      const container = new pixi.Container();
      const background = new pixi.Graphics();
      container.addChild(background);

      // add delete button
      const deleteButton = iconButton(() => {
        body.removePath(toBody);
        update();
      }, "close");
      deleteButton.position = new pixi.Point(0, 0);
      container.addChild(deleteButton);

      const textGraphics = new pixi.Text(
        `To ${toBody.name} via ${route.next.name} (${convertDistance(
          route.distance
        )})`,
        {
          fill: 0xffffff,
          fontSize: 16,
        }
      );
      textGraphics.position = new pixi.Point(deleteButton.width + 4, 6);
      container.addChild(textGraphics);

      background.beginFill(0xff0000);
      background.drawRect(0, 0, 0, textGraphics.height + 12);
      background.endFill();

      return { entry: container, update: () => {} };
    }
  );
  container.position = new pixi.Point(16, 40);
  windowContainer.addChild(container);

  // Add route button
  const addRouteButton = iconButton(() => {
    displayAddRouteWindow(body, window);
  }, "add");
  addRouteButton.position = new pixi.Point(
    16,
    container.y + container.height + 8
  );
  windowContainer.addChild(addRouteButton);
  addRouteButton.visible = body.pathTo.size < game.bodies.length - 1;

  // create window
  const window = new GWindow(windowContainer, ({ drawBackground }) => {
    update();
    if (addRouteButton) {
      addRouteButton.position = new pixi.Point(
        16,
        container.y + container.height + 8
      );
      addRouteButton.visible = body.pathTo.size < game.bodies.length - 1;
    }
    drawBackground(
      Math.max(container.width + 32, 300),
      addRouteButton.visible
        ? addRouteButton.y + addRouteButton.height + 16
        : container.y + container.height + 16
    );
  });
  parentWindow.clearChildren();
  parentWindow.addChild(window);
  addWindow(window);
}

function displayAddRouteWindow(
  body: CelestialBody,
  parentWindow: GWindow
): void {
  const windowContainer = new pixi.Container();

  // Draw window title
  const titleGraphics = new pixi.Text("Add Route", {
    fill: 0xffffff,
    fontSize: 20,
  });
  titleGraphics.position = new pixi.Point(16, 16);
  windowContainer.addChild(titleGraphics);

  // To body
  const toBodyGraphics = new pixi.Text("To", {
    fill: 0xffffff,
    fontSize: 16,
  });
  toBodyGraphics.position = new pixi.Point(16, 48);
  windowContainer.addChild(toBodyGraphics);

  const bodies = game.bodies.filter((b) => b !== body);

  const bodiesTo = bodies
    .filter((b) => !body.pathTo.has(b))
    .map((b) => ({ label: b.name, value: b }));

  const bodiesVia = game.bodies
    .filter((b) => b !== body)
    .map((b) => ({ label: b.name, value: b }));

  // To body dropdown
  let distanceText: pixi.Text;
  let selectedTo: CelestialBody | null = bodiesTo[0].value;
  let selectedVia: CelestialBody | null = bodiesVia[0].value;
  let viaDropdown: Dropdown;
  const dropdown = new Dropdown({
    width: 200,
    options: bodiesTo,
    onSelect: (option) => {
      selectedTo = option.value;
    },
    onOpen: () => {
      viaDropdown.closeOptions();
      viaDropdown.visible = false;
    },
    onClose: () => {
      viaDropdown.visible = true;
    },
  });
  dropdown.position = new pixi.Point(16, 72);

  // via body
  const viaBodyGraphics = new pixi.Text("Via", {
    fill: 0xffffff,
    fontSize: 16,
  });
  viaBodyGraphics.position = new pixi.Point(16, dropdown.y + dropdown.height);
  windowContainer.addChild(viaBodyGraphics);

  // via body dropdown
  viaDropdown = new Dropdown({
    width: 200,
    options: bodies.map((b) => ({ label: b.name, value: b })),
    onSelect: (option) => {
      selectedVia = option.value;
      distanceText.text = `distance: ${convertDistance(
        body.distanceTo(selectedVia!)
      )}`;
    },
    onOpen: () => {
      dropdown.closeOptions();
    },
  });
  viaDropdown.position = new pixi.Point(16, viaBodyGraphics.y + 24);

  let distance = body.distanceTo(selectedVia!);
  distanceText = new pixi.Text(`distance: ${convertDistance(distance)}`, {
    fill: 0xffffff,
    fontSize: 16,
  });
  distanceText.position = new pixi.Point(
    16,
    viaDropdown.y + viaDropdown.height + 8
  );
  windowContainer.addChild(distanceText);

  // Add route button
  const addRouteButton = iconButton(() => {
    body.addPath(selectedTo!, selectedVia!, body.distanceTo(selectedVia!));
    removeWindow(window);
  }, "add");
  addRouteButton.position = new pixi.Point(
    16,
    distanceText.y + distanceText.height + 8
  );
  windowContainer.addChild(addRouteButton);

  windowContainer.addChild(dropdown);
  windowContainer.addChild(viaDropdown);

  // create window
  const window = new GWindow(windowContainer, ({ drawBackground }) => {
    drawBackground(
      Math.max(dropdown.width + 32, 300),
      addRouteButton.y + addRouteButton.height + 16
    );
  });
  parentWindow.clearChildren();
  parentWindow.addChild(window);
  addWindow(window);
}
