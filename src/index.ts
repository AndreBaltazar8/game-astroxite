import "./main.css";
import Game, { BodyType, products } from "./game";
import { RenderObject, app, background, initPixi, viewport } from "./pixi";
import * as pixi from "pixi.js";
import drawInfoBox from "./window/body-info";
import { removeWindow, windows } from "./components/windows";
import game from "./game";
import { drawList } from "./components/list";
import { loopStopped, playCoin, playError, toggleLoop } from "./sounds";
import { iconButton } from "./components/button";
import { DropShadowFilter } from "@pixi/filter-drop-shadow";
import { Drag } from "pixi-viewport";
import { drawMainMenu } from "./menu";

initPixi();

const container = new pixi.Container();
viewport.addChild(container);

function randomColor() {
  // make a random color with at least 50% brightness
  const color = Math.random() * 0xffffff;
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness < 200) {
    return randomColor();
  }
  return color;
}

function randomColorGray() {
  const r = Math.random() * 0x55 + 0xaa;
  const g = Math.random() * 0x55 + 0xaa;
  const b = Math.random() * 0x55 + 0xaa;
  return (r << 16) + (g << 8) + b;
}

game.onAddBody((body) => {
  let graphics;
  if (body.type == BodyType.Star) {
    graphics = pixi.Sprite.from(
      `assets/star${Math.floor(Math.random() * 2)}.png`
    );
    graphics.width = body.radius * 3.5;
    graphics.height = body.radius * 3.5;
    graphics.anchor = new pixi.Point(0.5, 0.5);
    graphics.eventMode = "static";
    graphics.tint = randomColor();
  } else if (body.type == BodyType.Planet || body.type == BodyType.Moon) {
    graphics = pixi.Sprite.from(
      `assets/planet${Math.floor(Math.random() * 6)}.png`
    );
    graphics.width = body.radius * 3.5;
    graphics.height = body.radius * 3.5;
    graphics.anchor = new pixi.Point(0.5, 0.5);
    graphics.tint = randomColor();
  } else if (body.type == BodyType.Station) {
    graphics = pixi.Sprite.from(
      `assets/station${Math.floor(Math.random() * 2)}.png`
    );
    graphics.width = body.radius * 3.5;
    graphics.height = body.radius * 3.5;
    graphics.anchor = new pixi.Point(0.5, 0.5);
    graphics.tint = randomColorGray();
  }

  if (!graphics) {
    graphics = new pixi.Graphics();
    graphics.beginFill(body.name == "Sun" ? 0x00ff00 : 0xff0000);
    graphics.drawCircle(body.radius, body.radius, body.radius);
    graphics.endFill();
    graphics.anchor = new pixi.Point(0.5, 0.5);

    graphics.beginFill(0xff0000);
    graphics.drawCircle(body.radius, 0, 5);
    graphics.endFill();
  }

  graphics.cursor = "pointer";
  graphics.position = new pixi.Point(body.x, body.y);
  graphics.eventMode = "static";
  graphics.on("pointertap", (event) => {
    if (body.data.dataContainer) {
      removeWindow(body.data.dataContainer);
      body.data.dataContainer = null;
    }

    drawInfoBox(body, viewport.toWorld(event.page));
  });
  // add planet name
  const text = new pixi.Text(
    `${body.name}`,
    new pixi.TextStyle({ fill: 0xffffff, fontSize: 12, fontWeight: "bold" })
  );
  text.position = new pixi.Point(
    body.x - text.width / 2,
    body.y + body.radius + 5
  );

  container.addChild(graphics);
  container.addChild(text);

  body.data.graphics = graphics;
  body.onUpdate((body) => {
    text.position = new pixi.Point(
      body.x - text.width / 2,
      body.y + body.radius + 5
    );
    graphics.position = new pixi.Point(body.x, body.y);
    graphics.rotation = body.rotation;
  });
});

game.onAddCargoShip((ship) => {
  const sprite = pixi.Sprite.from(`assets/ship.png`);
  sprite.position = new pixi.Point(ship.x, ship.y);
  sprite.width = 20;
  sprite.height = 20;
  container.addChild(sprite);
  ship.data.graphics = sprite;
  ship.onUpdate((ship) => {
    // calc direction
    const target = new pixi.Point(ship.target.x, ship.target.y);
    const direction = new pixi.Point(target.x - ship.x, target.y - ship.y);
    const angle = Math.atan2(direction.y, direction.x) + Math.PI / 4;
    sprite.rotation = angle;
    sprite.position = new pixi.Point(ship.x, ship.y);
  });
});

game.onRemoveCargoShip((ship) => {
  container.removeChild(ship.data.graphics);
});

game.init();

function drawProduct(product, amount) {
  const container = new pixi.Container();
  const productText = new pixi.Text(
    `${amount} ${product.name}`,
    new pixi.TextStyle({ fill: 0xffffff })
  );
  container.addChild(productText);
  return {
    obj: container,
    update: () => {
      productText.text = `${amount} ${product.name}`;
    },
  };
}

const { container: missionList, update: updateMissionList } = drawList(
  () => game.missions,
  (mission) => {
    const entryPadding = 8;
    const entry = new pixi.Container();
    const background = new pixi.Graphics();
    entry.addChild(background);

    // Add mission name
    const text = new pixi.Text(
      `${mission.target.name}`,
      new pixi.TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: "bold" })
    );
    text.position = new pixi.Point(entryPadding, entryPadding);

    // Add products
    let idx = 0;
    const products = new pixi.Graphics();
    products.position = new pixi.Point(0, text.height + entryPadding);
    const renderObjects: RenderObject<pixi.Container>[] = [];
    for (const [product, amount] of mission.products) {
      const productDrawn = drawProduct(product, amount);
      productDrawn.obj.position = new pixi.Point(
        entryPadding,
        idx * productDrawn.obj.height
      );
      renderObjects.push(productDrawn);
      products.addChild(productDrawn.obj);

      const progressBar = new pixi.Graphics();
      function drawProgressBar() {
        progressBar.clear();
        progressBar.beginFill(0x00ff00);
        progressBar.drawRect(
          0,
          0,
          Math.min((mission.target.products.get(product) ?? 0) / amount, 1) *
            100,
          4
        );
        progressBar.endFill();
      }

      renderObjects.push({
        obj: progressBar,
        update: () => drawProgressBar(),
      });
      drawProgressBar();
      progressBar.position = new pixi.Point(0, productDrawn.obj.height);
      productDrawn.obj.addChild(progressBar);
      idx++;
    }
    entry.addChild(products);

    // Add complete button
    const completeBtn = new pixi.Graphics();
    const completeText = new pixi.Text(
      `Complete`,
      new pixi.TextStyle({ fill: mission.canComplete() ? 0xffffff : 0xaaaaaa })
    );
    completeText.position = new pixi.Point(8, 4);
    completeBtn.addChild(completeText);

    function drawButton() {
      completeBtn.clear();
      completeBtn.beginFill(mission.canComplete() ? 0x007800 : 0x444444);
      completeBtn.drawRect(
        0,
        0,
        completeText.width + 16,
        completeText.height + 8
      );
      completeBtn.endFill();
    }
    drawButton();
    completeBtn.position = new pixi.Point(
      entryPadding,
      products.y + products.height + 8
    );
    completeBtn.eventMode = "static";
    completeBtn.on("pointertap", () => {
      game.completeMission(mission);
      playCoin();
    });
    entry.addChild(completeBtn);
    entry.addChild(text);

    // add reward after complete button
    const rewardText = new pixi.Text(
      `${mission.reward} coins`,
      new pixi.TextStyle({ fill: 0xffffff })
    );
    rewardText.position = new pixi.Point(
      completeBtn.x + completeBtn.width + 8,
      completeBtn.y + 4
    );
    entry.addChild(rewardText);

    // add delete button
    const deleteBtn = iconButton(() => {
      game.removeMission(mission);
      playError();
    }, "close");
    deleteBtn.position = new pixi.Point(
      300 - deleteBtn.width - 8,
      entryPadding
    );
    entry.addChild(deleteBtn);

    background.beginFill(0xffffff, 0.05);
    background.drawRect(0, 0, 300, entry.height + 16);
    background.endFill();
    return {
      entry,
      update: () => {
        renderObjects.forEach((product) => product.update());

        drawButton();
      },
    };
  },
  {
    buildTitle: () => {
      const title = new pixi.Text(
        `Missions`,
        new pixi.TextStyle({ fill: 0xffffff, fontSize: 20, fontWeight: "bold" })
      );
      const container = new pixi.Container();
      // background
      const background = new pixi.Graphics();
      background.beginFill(0xffffff, 0.1);
      background.drawRect(0, 0, 300, title.height + 16);
      background.endFill();
      container.addChild(background);

      title.position = new pixi.Point(8, 8);

      container.addChild(title);
      return { obj: container, update: () => {} };
    },
  }
);
missionList.position = new pixi.Point(
  window.innerWidth - missionList.width,
  40
);
app.stage.addChild(missionList);

const coinText = new pixi.Text(
  `${game.coins} coins`,
  new pixi.TextStyle({ fill: 0xffffff })
);
coinText.position = new pixi.Point(window.innerWidth - coinText.width, 0);
app.stage.addChild(coinText);

let last = performance.now();
let gameStarted = false;

// create main menu
drawMainMenu({
  onPlay: () => {
    gameStarted = true;
  },
});

// toggle music loop
const musicTextToggle = new pixi.Text(
  `Music: ${loopStopped ? "off" : "on"}`,
  new pixi.TextStyle({ fill: 0xffffff })
);
musicTextToggle.position = new pixi.Point(
  window.innerWidth - musicTextToggle.width,
  window.innerHeight - musicTextToggle.height
);
musicTextToggle.eventMode = "static";
musicTextToggle.on("pointertap", () => {
  toggleLoop();
  musicTextToggle.text = `Music: ${loopStopped ? "off" : "on"}`;
  musicTextToggle.position = new pixi.Point(
    window.innerWidth - musicTextToggle.width,
    window.innerHeight - musicTextToggle.height
  );
});
app.stage.addChild(musicTextToggle);
window.addEventListener("resize", () => {
  musicTextToggle.position = new pixi.Point(
    window.innerWidth - musicTextToggle.width,
    window.innerHeight - musicTextToggle.height
  );
});

app.ticker.add(() => {
  if (!gameStarted) {
    last = performance.now();
    return;
  }
  const now = performance.now();
  const deltaMs = now - last;
  last = now;

  game.update(deltaMs / 1000);

  coinText.text = `${game.coins} coins`;
  coinText.position = new pixi.Point(window.innerWidth - coinText.width, 0);
  missionList.position = new pixi.Point(
    window.innerWidth - missionList.width,
    40
  );
  background.tilePosition = viewport.position;
  background.tileScale.set(viewport.scale.x, viewport.scale.y);

  updateMissionList();
  windows.forEach((window) => window.update());
});
