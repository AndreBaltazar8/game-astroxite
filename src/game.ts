import { notifyError } from "./pixi";

export class Product {
  name: string;
  constructor({ name }: { name: string }) {
    this.name = name;
  }
}

export const products = {
  hydrogen: new Product({ name: "Hydrogen" }),
  helium: new Product({ name: "Helium" }),
  carbon: new Product({ name: "Carbon" }),
  neon: new Product({ name: "Neon" }),
  oxygen: new Product({ name: "Oxygen" }),
  silicon: new Product({ name: "Silicon" }),
  iron: new Product({ name: "Iron" }),
  water: new Product({ name: "Water" }),
};

class UpdatableObject<T> {
  onUpdateCallbacks: ((obj: T, delta: number) => void)[] = [];
  onUpdate(callback: (obj: T, delta: number) => void) {
    this.onUpdateCallbacks.push(callback);
  }
  update(delta: number) {
    this.onUpdateCallbacks.forEach((callback) =>
      callback(this as unknown as T, delta)
    );
  }
}

export class Factory {
  product: Product;
  maxProduction: number;
  currentProduction: number;
  requires: Map<Product, number>;
  constructor({
    product,
    maxProduction,
    currentProduction,
    requires,
  }: {
    product: Product;
    maxProduction: number;
    currentProduction: number;
    requires: Map<Product, number>;
  }) {
    this.product = product;
    this.maxProduction = maxProduction;
    this.currentProduction = currentProduction;
    this.requires = requires;
  }
}

export type ShipDefinition = {
  range: number;
};

export class Route {
  distance: number;
  next: CelestialBody;
}

export enum BodyType {
  Star,
  Planet,
  Moon,
  Asteroid,
  Station,
}

export class Mission {
  key: string;
  target: CelestialBody;
  products: Map<Product, number>;
  reward: number;
  constructor({
    key,
    target,
    products,
    reward,
  }: {
    key: string;
    target: CelestialBody;
    products: Map<Product, number>;
    reward: number;
  }) {
    this.key = key;
    this.target = target;
    this.products = products;
    this.reward = reward;
  }

  canComplete(): boolean {
    const hasAllProducts = Array.from(this.products.entries()).every(
      ([product, amount]) => {
        const currentAmount = this.target.products.get(product) || 0;
        return currentAmount >= amount;
      }
    );
    return hasAllProducts;
  }
}

const StarProductRarities = new Map<Product, number>([
  [products.hydrogen, 1],
  [products.helium, 0.3],
  [products.carbon, 0.2],
  [products.neon, 0.1],
  [products.oxygen, 0.1],
  [products.silicon, 0.04],
]);

const StarRecipies = new Map<Product, Product>([
  [products.hydrogen, products.helium],
  [products.helium, products.carbon],
  [products.carbon, products.neon],
  [products.carbon, products.oxygen],
  [products.oxygen, products.silicon],
  [products.silicon, products.iron],
]);

const MissionProductChances = new Map<Product, number>([
  [products.iron, 1],
  [products.helium, 0.2],
  [products.carbon, 0.15],
  [products.neon, 0.05],
  [products.oxygen, 0.1],
  [products.silicon, 0.05],
  [products.water, 0.1],
]);

const ProductRecipies = new Map<Product, Product[]>([
  [products.water, [products.hydrogen, products.oxygen]],
  [products.iron, [products.helium, products.carbon]],
]);

const ProductMultipliers = new Map<Product, number>([
  [products.water, 1],
  [products.iron, 1],
  [products.carbon, 0.1],
]);

function pickRandomStarProduct(): Product {
  const entries = Array.from(StarProductRarities.entries());
  const total = entries.reduce((a, [_, b]) => a + b, 0);
  const random = Math.random() * total;
  let current = 0;
  for (const [product, rarity] of entries) {
    current += rarity;
    if (random < current) {
      return product;
    }
  }
  throw new Error("Failed to pick random star product");
}

function pickRandomMissionProduct(): Product {
  const entries = Array.from(MissionProductChances.entries());
  const total = entries.reduce((a, [_, b]) => a + b, 0);
  const random = Math.random() * total;
  let current = 0;
  for (const [product, rarity] of entries) {
    current += rarity;
    if (random < current) {
      return product;
    }
  }
  throw new Error("Failed to pick random mission product");
}

export class CelestialBody extends UpdatableObject<CelestialBody> {
  type: BodyType = BodyType.Planet;
  game: Game;
  name: string;
  x: number = 0;
  y: number = 0;
  radius: number = 10;
  rotation: number = 0;
  rotationSpeed: number = 0.2;
  data: Record<string, any> = {};
  products: Map<Product, number> = new Map();
  factories: Factory[] = [];
  ships: ShipDefinition[] = [];
  pathTo: Map<CelestialBody, Route> = new Map();
  efficiencyLoss: number = 0.0237;
  target: { x: number; y: number } | null = null;
  speed: number = 10;
  missons: Mission[] = [];

  buildingStation: boolean = false;
  stationTimeLeft: number = 0;

  get bestShipRange(): number {
    return this.ships.reduce((a, b) => (b.range > a ? b.range : a), 0);
  }

  addPath(to: CelestialBody, via: CelestialBody, distance: number) {
    if (this.pathTo.has(to))
      throw new Error("Path already exists to this celestial body");
    this.pathTo.set(to, { distance, next: via });
  }
  removePath(to: CelestialBody) {
    this.pathTo.delete(to);
  }
  distanceTo(body: { x: number; y: number }): number {
    return Math.sqrt(
      Math.pow(this.x - body.x, 2) + Math.pow(this.y - body.y, 2)
    );
  }
  buildShip() {
    const iron = this.products.get(products.iron) ?? 0;
    if (iron < 300) {
      throw new Error("Not enough iron");
    }

    this.products.set(products.iron, iron - 300);
    this.ships.push({ range: 500 });
  }

  buildFactory({ product }: { product: Product }) {
    const coins = this.game.coins;
    if (coins < 1000) {
      throw new Error("Not enough coins");
    }

    if (this.factories.find((factory) => factory.product === product)) {
      throw new Error("Already has factory for this product");
    }

    this.game.coins -= 1000;
    const production =
      (Math.floor(Math.random() * 20) * 5 + 50) *
      (ProductMultipliers.get(product) ?? 1);
    this.factories.push(
      new Factory({
        product,
        maxProduction: production,
        currentProduction: production,
        requires: new Map(
          ProductRecipies.get(product)?.map((product) => [
            product,
            Math.floor(Math.random() * 20) * 5 + 30,
          ]) ?? []
        ),
      })
    );
  }

  buildStation() {
    if (this.buildingStation) {
      throw new Error("Already building station");
    }
    const iron = this.products.get(products.iron) ?? 0;
    if (iron < 10000) {
      throw new Error("Not enough iron");
    }

    this.products.set(products.iron, iron - 10000);
    this.buildingStation = true;
    this.stationTimeLeft = 2;
  }

  update(delta): void {
    super.update(delta);

    if (this.target) {
      const distance = Math.sqrt(
        Math.pow(this.target.x - this.x, 2) +
          Math.pow(this.target.y - this.y, 2)
      );
      if (distance < 1) {
        this.target = null;
      } else {
        this.x += ((this.target.x - this.x) / distance) * delta * this.speed;
        this.y += ((this.target.y - this.y) / distance) * delta * this.speed;
      }
    }

    this.rotation += this.rotationSpeed * delta;
    this.factories.forEach((factory) => {
      const product = factory.product;
      const currentProduction = factory.currentProduction;
      const pctProduction = currentProduction / factory.maxProduction;

      let maxAmountCanProduce = Infinity;
      factory.requires.forEach((requiredAmount, requiredProduct) => {
        const amount = this.products.get(requiredProduct) || 0;
        const amountCanProduce = amount / requiredAmount;
        if (amountCanProduce < maxAmountCanProduce) {
          maxAmountCanProduce = amountCanProduce;
        }
      });

      const pctThisFrame = Math.min(pctProduction * delta, maxAmountCanProduce);
      if (pctThisFrame === 0) {
        return;
      }
      factory.requires.forEach((requiredAmount, requiredProduct) => {
        const amount = this.products.get(requiredProduct) || 0;
        const amountToProduce = requiredAmount * pctThisFrame;
        this.products.set(requiredProduct, amount - amountToProduce);
      });
      const amount = this.products.get(product) || 0;
      const factoryIfficiency = 1 - this.efficiencyLoss;
      this.products.set(
        product,
        amount + pctThisFrame * factory.maxProduction * factoryIfficiency
      );
    });

    if (this.buildingStation && this.stationTimeLeft > 0) {
      this.stationTimeLeft -= delta;
      if (this.stationTimeLeft <= 0) {
        this.buildingStation = false;
        this.stationTimeLeft = 0;

        const station = new CelestialBody();
        station.type = BodyType.Station;
        station.game = this.game;
        station.name = this.game.generateUniqueBodyName();
        const angle = Math.random() * Math.PI * 2;
        station.x = this.x + Math.cos(angle) * this.radius * 2;
        station.y = this.y + Math.sin(angle) * this.radius * 2;
        station.radius = 20;
        station.rotation = 2;
        station.rotationSpeed =
          (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
        this.game.addBody(station);
      }
    }
  }
}

class CargoShip extends UpdatableObject<CargoShip> {
  game: Game;
  x: number = 0;
  y: number = 0;
  speed: number = 100;
  target: CelestialBody;
  finalTarget: CelestialBody;
  products: Map<Product, number> = new Map();
  data: Record<string, any> = {};
  ship: ShipDefinition;
  constructor({
    game,
    target,
    finalTarget,
    ship,
  }: {
    game: Game;
    target: CelestialBody;
    finalTarget: CelestialBody;
    ship: ShipDefinition;
  }) {
    super();
    this.game = game;
    this.target = target;
    this.finalTarget = finalTarget;
    this.ship = ship;
  }

  update(delta): void {
    super.update(delta);
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > this.target.radius) {
      this.x += (dx / distance) * this.speed * delta;
      this.y += (dy / distance) * this.speed * delta;
    } else {
      if (this.target == this.finalTarget) {
        this.game.deliverProduct(this, this.target);
        return;
      } else {
        const next = this.target.pathTo.get(this.finalTarget)?.next;
        if (next && this.target.distanceTo(next) < this.ship.range) {
          this.target = next;
        } else {
          if (this.target != this.finalTarget) {
            notifyError(new Error("No path to final target, aborting"));
          }
          this.game.deliverProduct(this, this.target);
          return;
        }
      }
    }
  }
}

export class Game {
  coins: number = 0;
  timeToMission: number = 1;

  bodies: CelestialBody[] = [];
  addBodyCallbacks: ((body: CelestialBody) => void)[] = [];
  cargoShips: CargoShip[] = [];
  addCargoShipCallbacks: ((ship: CargoShip) => void)[] = [];
  removeCargoShipCallbacks: ((ship: CargoShip) => void)[] = [];
  missionCount: number = 0;
  missions: Mission[] = [];

  init() {
    this.#generateBodies();
  }

  addBody(body: CelestialBody) {
    this.bodies.push(body);
    this.addBodyCallbacks.forEach((callback) => callback(body));
  }

  #generateBodies() {
    const body = new CelestialBody();
    body.game = this;
    body.type = BodyType.Star;
    body.name = "Sun";
    body.x = 100;
    body.y = 200;
    body.rotation = 0.5;
    body.radius = 60;
    body.products = new Map([[products.hydrogen, 10000]]);
    body.factories = [
      new Factory({
        product: products.helium,
        maxProduction: 50,
        currentProduction: 50,
        requires: new Map([[products.hydrogen, 5]]),
      }),
    ];
    body.ships = [{ range: 500 }, { range: 500 }];
    this.addBody(body);

    const body2 = new CelestialBody();
    body2.game = this;
    body2.type = BodyType.Planet;
    body2.name = "Earth";
    body2.x = 400;
    body2.y = 440;
    body2.radius = 40;
    body2.rotation = 4;
    body2.products = new Map([
      [products.carbon, 7000],
      // [products.iron, 70000],
    ]);
    body2.factories = [
      new Factory({
        product: products.iron,
        maxProduction: 100,
        currentProduction: 100,
        requires: new Map([
          [products.helium, 50],
          [products.carbon, 50],
        ]),
      }),
    ];
    this.addBody(body2);

    const body3 = new CelestialBody();
    body3.game = this;
    body3.type = BodyType.Moon;
    body3.name = "Moon";
    body3.x = 800;
    body3.y = 340;
    body3.radius = 20;
    body3.rotation = 2;
    body3.products = new Map([[products.carbon, 3000]]);
    body3.factories = [
      new Factory({
        product: products.iron,
        maxProduction: 100,
        currentProduction: 100,
        requires: new Map([
          [products.helium, 50],
          [products.carbon, 50],
        ]),
      }),
    ];
    this.addBody(body3);

    body2.pathTo.set(body, { distance: 300, next: body });
    body2.pathTo.set(body3, { distance: 300, next: body3 });
  }

  hasRouteToWithShip(body: CelestialBody, toBody: CelestialBody) {
    const bestShipRange = body.bestShipRange;
    return (
      game.bodies.filter(
        (b) =>
          b != body &&
          b != toBody &&
          b.distanceTo(body) < bestShipRange &&
          b.pathTo.get(toBody) != null
      ).length > 0
    );
  }

  getNextInRoute(body: CelestialBody, toBody: CelestialBody) {
    const bestShipRange = body.bestShipRange;
    const bodies = game.bodies.filter(
      (b) =>
        b != body &&
        b != toBody &&
        b.distanceTo(body) < bestShipRange &&
        b.pathTo.get(toBody) != null
    );
    if (bodies.length === 0) {
      return null;
    }
    bodies.sort((a, b) => {
      const aRoute = a.pathTo.get(toBody)!;
      const bRoute = b.pathTo.get(toBody)!;
      return aRoute.distance - bRoute.distance;
    });
    return bodies[0];
  }

  sendEmptyShip(from: CelestialBody, to: CelestialBody) {
    if (from.ships.length === 0) {
      throw new Error(`No ships on ${from.name}`);
    }

    const canGoDirectly = from.distanceTo(to) < from.bestShipRange;
    if (!canGoDirectly && !this.hasRouteToWithShip(from, to)) {
      throw new Error(`No route to ${to.name} from ${from.name}`);
    }

    const route = canGoDirectly ? to : this.getNextInRoute(from, to)!;
    const ship = from.ships.pop();
    if (!ship) {
      throw new Error(`No ship on ${from.name}`);
    }

    const cargoShip = new CargoShip({
      game: this,
      ship,
      target: route,
      finalTarget: to,
    });
    cargoShip.x = from.x;
    cargoShip.y = from.y;
    this.cargoShips.push(cargoShip);
    this.addCargoShipCallbacks.forEach((callback) => callback(cargoShip));
  }

  sendProduct(
    from: CelestialBody,
    to: CelestialBody,
    product: Product,
    amount: number
  ) {
    if (from.ships.length === 0) {
      throw new Error(`No ships on ${from.name}`);
    }

    const productAmountFrom = from.products.get(product);
    if (productAmountFrom === undefined) {
      throw new Error(`Product ${product} not found on ${from.name}`);
    }
    if (productAmountFrom < amount) {
      throw new Error(`Not enough ${product.name} on ${from.name}`);
    }

    const canGoDirectly = from.distanceTo(to) < from.bestShipRange;
    if (!canGoDirectly && !this.hasRouteToWithShip(from, to)) {
      throw new Error(`No route to ${to.name} from ${from.name}`);
    }

    const route = canGoDirectly ? to : this.getNextInRoute(from, to)!;

    const ship = from.ships.pop();
    if (!ship) {
      throw new Error(`No ship on ${from.name}`);
    }

    from.products.set(product, productAmountFrom - amount);

    const cargoShip = new CargoShip({
      game: this,
      ship,
      target: route,
      finalTarget: to,
    });
    cargoShip.x = from.x;
    cargoShip.y = from.y;
    cargoShip.products.set(product, amount);
    this.cargoShips.push(cargoShip);
    this.addCargoShipCallbacks.forEach((callback) => callback(cargoShip));
  }

  deliverProduct(ship: CargoShip, to: CelestialBody) {
    ship.products.forEach((amount, product) => {
      const productAmountTo = to.products.get(product) || 0;
      to.products.set(product, productAmountTo + amount);
    });
    this.cargoShips = this.cargoShips.filter((s) => s !== ship);
    this.removeCargoShipCallbacks.forEach((callback) => callback(ship));
    to.ships.push(ship.ship);
  }

  onAddBody(callback: (body: CelestialBody) => void) {
    this.addBodyCallbacks.push(callback);
  }

  onAddCargoShip(callback: (ship: CargoShip) => void) {
    this.addCargoShipCallbacks.push(callback);
  }

  onRemoveCargoShip(callback: (ship: CargoShip) => void) {
    this.removeCargoShipCallbacks.push(callback);
  }

  update(delta: number) {
    this.bodies.forEach((body) => {
      body.update(delta);
    });

    this.cargoShips.forEach((ship) => {
      ship.update(delta);
    });

    if (this.timeToMission > 0) {
      this.timeToMission -= delta;
      if (this.timeToMission <= 0 && this.missions.length < 3) {
        // add new mission
        const index = Math.floor(Math.random() * this.bodies.length) + 1;
        if (index === this.bodies.length) {
          const randomType = Math.floor(Math.random() * 3);
          const types = [BodyType.Star, BodyType.Planet, BodyType.Moon];
          const name = this.generateUniqueBodyName();

          const body = new CelestialBody();
          body.game = this;
          body.type = types[randomType];
          body.name = name;
          // pick a position not too close and not too far from other bodies
          const minDistance = 340 + this.bodies.length * 10;
          const maxDistance = 400 + this.bodies.length * 50;
          // map all other positions
          const positions = this.bodies.map((b) => [b.x, b.y]);
          let hasPosition = false;
          do {
            const selectedPosition =
              positions[Math.floor(Math.random() * positions.length)];
            const randomDistance = Math.floor(
              Math.random() * (maxDistance - minDistance) + minDistance
            );
            const angle = Math.random() * Math.PI * 2;
            const x = selectedPosition[0] + Math.cos(angle) * randomDistance;
            const y = selectedPosition[1] + Math.sin(angle) * randomDistance;

            if (
              this.bodies.filter((b) => b.distanceTo({ x, y }) < minDistance)
                .length === 0 &&
              this.bodies.filter((b) => b.distanceTo({ x, y }) > maxDistance)
                .length > 0
            ) {
              hasPosition = true;
              body.x = x;
              body.y = y;
            }
          } while (!hasPosition);
          body.rotation = 0.5;
          body.rotationSpeed =
            (Math.random() * 0.2 + 0.1) * (Math.random() > 0.5 ? 1 : -1);
          if (body.type === BodyType.Star) {
            body.radius = 60;
            // generate a factory
            const product = pickRandomStarProduct();
            body.products.set(
              product,
              Math.floor(Math.random() * 20 + 10) * 1000
            );
            const production = Math.floor(Math.random() * 10) * 10 + 100;
            const factory = new Factory({
              product: StarRecipies.get(product)!,
              maxProduction: production,
              currentProduction: production,
              requires: new Map([
                [product, Math.floor(Math.random() * 10) * 5 + 50],
              ]),
            });
            body.factories.push(factory);
          } else if (body.type === BodyType.Moon) {
            body.radius = 20;
          } else if (body.type === BodyType.Planet) {
            body.radius = 40;
          }
          this.addBody(body);
        }
        const missionBody = this.bodies[index];
        const mission = new Mission({
          key: this.missionCount.toString(),
          target: missionBody,
          products: new Map([
            [
              pickRandomMissionProduct(),
              Math.floor(Math.random() * 30) * 5 + 100,
            ],
          ]),
          reward: Math.floor(Math.random() * 10) * 5 + 100,
        });
        this.missionCount++;
        missionBody.missons.push(mission);
        this.missions.push(mission);

        this.timeToMission = Math.random() * 20 + 10;
      } else if (this.timeToMission <= 0) {
        this.timeToMission = Math.random() * 20 + 10;
      }
    }
  }

  completeMission(mission: Mission) {
    if (!this.missions.includes(mission)) {
      throw new Error("Mission not found");
    }

    if (!mission.canComplete()) {
      throw new Error("Mission cannot be completed yet");
    }

    // remove products from target
    mission.products.forEach((amount, product) => {
      const productAmount = mission.target.products.get(product) || 0;
      mission.target.products.set(product, productAmount - amount);
    });

    this.missions = this.missions.filter((m) => m !== mission);
    mission.target.missons = mission.target.missons.filter(
      (m) => m !== mission
    );
    this.coins += mission.reward;
  }

  removeMission(mission: Mission) {
    if (!this.missions.includes(mission)) {
      throw new Error("Mission not found");
    }

    this.missions = this.missions.filter((m) => m !== mission);
    mission.target.missons = mission.target.missons.filter(
      (m) => m !== mission
    );

    if (this.missions.length === 0 && this.timeToMission > 20) {
      this.timeToMission = Math.random() * 10 + 10;
    }
  }

  generateUniqueBodyName(): string {
    let name = "";
    do {
      name = randomName();
    } while (this.bodies.find((body) => body.name === name));
    return name;
  }
}

const randomName = () => {
  const first = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
  ];
  const second = [
    "Centauri",
    "Cygni",
    "Pegasi",
    "Ceti",
    "Arietis",
    "Tauri",
    "Orionis",
    "Canis",
    "Majoris",
    "Minoris",
    "Ursae",
  ];
  return `${first[Math.floor(Math.random() * first.length)]}${
    second[Math.floor(Math.random() * second.length)]
  }${Math.floor(Math.random() * 100) + 1}`;
};

export function convertDistance(distance: number) {
  return `${(distance / 400).toFixed(2)}au`;
}

const game = new Game();
export default game;
