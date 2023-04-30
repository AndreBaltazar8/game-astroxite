import * as pixi from "pixi.js";
import { RenderObject } from "../pixi";

export interface ListOptions {
  buildTitle?: () => RenderObject<pixi.Container>;
}

export function drawList<T extends { key: string }>(
  getList: () => T[],
  draw: (item: T) => { entry: pixi.Container; update: (item: T) => void },
  options: ListOptions = {}
) {
  const listWrapper = new pixi.Container();
  const container = new pixi.Container();
  const graphics: Map<
    any,
    { entry: pixi.Container; index: number; update: (item: T) => void }
  > = new Map();

  let index = 0;
  const list = getList();
  let accHeight = 0;
  list.forEach((item) => {
    const { entry, update } = draw(item);
    entry.position = new pixi.Point(0, accHeight);
    container.addChild(entry);
    graphics.set(item.key, { entry, index, update });
    index++;
    accHeight += entry.height;
  });
  container.eventMode = "static";

  let updateTitle: () => void | undefined;
  if (options.buildTitle) {
    const { obj, update } = options.buildTitle();
    updateTitle = update;
    obj.position = new pixi.Point(0, 0);
    listWrapper.addChild(obj);
    container.position = new pixi.Point(0, obj.height);
  }

  listWrapper.addChild(container);

  return {
    container: listWrapper,
    update: () => {
      updateTitle?.();
      const list = getList();
      let hasUpdated = false;
      list.forEach((item) => {
        const obj = graphics.get(item.key);
        if (!obj) {
          const { entry, update } = draw(item);
          entry.position = new pixi.Point(0, 0);
          container.addChild(entry);
          graphics.set(item.key, { entry, index, update });
          index++;
          hasUpdated = true;
        } else {
          obj.update(item);
        }
      });
      graphics.forEach(({ entry }, key) => {
        if (!list.find((i) => i.key == key)) {
          container.removeChild(entry);
          entry.destroy();
          graphics.delete(key);
          hasUpdated = true;
        }
      });
      if (hasUpdated) {
        index = 0;
        accHeight = 0;
        graphics.forEach((obj, item) => {
          obj.entry.position = new pixi.Point(0, accHeight);
          obj.index = index;
          index++;
          accHeight += obj.entry.height;
        });
      }
    },
  };
}
