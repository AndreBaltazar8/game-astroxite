import * as pixi from "pixi.js";

export interface Option {
  label: string;
  value: any;
}

export interface DropdownOptions {
  width: number;
  options: Option[];
  onSelect: (option: Option) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export class Dropdown extends pixi.Container {
  private background: pixi.Graphics;
  private label: pixi.Text;
  private arrow: pixi.Graphics;
  private optionsContainer: pixi.Container;
  private isOpen: boolean = false;
  private onOpen?: () => void;
  private onClose?: () => void;

  constructor(private options: DropdownOptions) {
    super();
    this.createBackground();
    this.createLabel();
    this.createArrow();
    this.createOptions();
    this.setupEvents();
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
  }

  private createBackground() {
    this.background = new pixi.Graphics();
    this.background.beginFill(0xffffff);
    this.background.drawRect(0, 0, this.options.width, 30);
    this.background.endFill();
    this.addChild(this.background);
  }

  private createLabel() {
    this.label = new pixi.Text(this.options.options[0].label, {
      fontSize: 16,
      fill: 0x000000,
    });
    this.label.eventMode = "none";
    this.label.position.set(10, 5);
    this.addChild(this.label);
  }

  private createArrow() {
    this.arrow = new pixi.Graphics();
    this.arrow.lineStyle(1, 0x000000);
    this.arrow.moveTo(0, 0);
    this.arrow.lineTo(5, 5);
    this.arrow.lineTo(10, 0);
    this.arrow.pivot.set(5, 2.5);
    this.arrow.position.set(this.options.width - 15, 14);
    this.addChild(this.arrow);
  }

  private createOptions() {
    this.optionsContainer = new pixi.Container();
    this.optionsContainer.position.set(0, 30);
    this.options.options.forEach((option, index) => {
      const optionContainer = new pixi.Container();
      const text = new pixi.Text(option.label, {
        fontSize: 16,
        fill: 0x000000,
      });
      text.eventMode = "none";
      text.position.set(10, index * 30);
      // option background
      const background = new pixi.Graphics();
      background.beginFill(0xffffff);
      background.drawRect(0, index * 30, this.options.width, 30);
      background.endFill();
      background.eventMode = "static";
      background.on("pointertap", () => {
        this.label.text = option.label;
        this.options.onSelect(option);
        this.closeOptions();
      });
      optionContainer.addChild(background);
      optionContainer.addChild(text);
      this.optionsContainer.addChild(optionContainer);
    });
    // Background
    const background = new pixi.Graphics();
    background.beginFill(0xffffff);
    background.drawRect(
      0,
      0,
      this.options.width,
      this.options.options.length * 30
    );
    background.endFill();
    background.lineStyle(1, 0x000000);
    background.drawRect(
      0,
      0,
      this.options.width,
      this.options.options.length * 30
    );
    this.optionsContainer.addChildAt(background, 0);
    this.optionsContainer.visible = false;
    this.addChild(this.optionsContainer);
  }

  private setupEvents() {
    this.background.eventMode = "static";
    this.background.on("pointertap", () => {
      if (this.isOpen) {
        this.closeOptions();
      } else {
        this.openOptions();
      }
    });
  }

  public openOptions() {
    this.isOpen = true;
    this.arrow.rotation = Math.PI;
    this.optionsContainer.visible = true;
    this.onOpen?.();
  }

  public closeOptions() {
    this.isOpen = false;
    this.arrow.rotation = 0;
    this.optionsContainer.visible = false;
    this.onClose?.();
  }
}
