import * as pixi from "pixi.js";

interface NumberInputOptions {
  width: number;
  height: number;
  value?: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  onChange?: (value: number) => void;
}

class NumberInput extends pixi.Container {
  private background: pixi.Graphics;
  private label: pixi.Text;
  private minusButton: pixi.Graphics;
  private plusButton: pixi.Graphics;
  private valueText: pixi.Text;
  private value: number;

  constructor(private options: NumberInputOptions) {
    super();
    this.value = options.value || 0;
    this.createBackground();
    this.createLabel();
    this.createMinusButton();
    this.createPlusButton();
    this.createValueText();
    this.setupEvents();
  }

  private createBackground() {
    this.background = new pixi.Graphics();
    this.background.beginFill(0xffffff);
    this.background.drawRect(0, 0, this.options.width, this.options.height);
    this.background.endFill();
    this.addChild(this.background);
  }

  private createLabel() {
    this.label = new pixi.Text("Number:", {
      fontSize: 16,
      fill: 0x000000,
    });
    this.label.position.set(10, 5);
    this.addChild(this.label);
  }

  private createMinusButton() {
    this.minusButton = new pixi.Graphics();
    this.minusButton.lineStyle(1, 0x000000);
    this.minusButton.drawRect(0, 0, 20, 20);
    this.minusButton.position.set(10, 30);
    this.minusButton.eventMode = "static";
    this.minusButton.on("pointerdown", () => {
      this.setValue(this.value - (this.options.step ?? 1));
    });
    this.addChild(this.minusButton);
  }

  private createPlusButton() {
    this.plusButton = new pixi.Graphics();
    this.plusButton.lineStyle(1, 0x000000);
    this.plusButton.drawRect(0, 0, 20, 20);
    this.plusButton.position.set(this.options.width - 30, 30);
    this.plusButton.eventMode = "static";
    this.plusButton.on("pointerdown", () => {
      this.setValue(this.value + (this.options.step ?? 1));
    });
    this.addChild(this.plusButton);
  }

  private createValueText() {
    this.valueText = new pixi.Text(this.value.toString(), {
      fontSize: 16,
      fill: 0x000000,
    });
    this.valueText.position.set(40, 30);
    this.addChild(this.valueText);
  }

  private setupEvents() {
    this.background.interactive = true;
    this.background.on("pointerdown", () => {
      const newValue = window.prompt(
        "Enter a new value:",
        this.value.toString()
      );
      if (newValue !== null) {
        const parsedValue = parseFloat(newValue);
        if (!isNaN(parsedValue)) {
          this.setValue(parsedValue);
        }
      }
    });
  }

  private setValue(newValue: number) {
    const minValue = this.options.minValue || Number.NEGATIVE_INFINITY;
    const maxValue = this.options.maxValue || Number.POSITIVE_INFINITY;
    this.value = Math.max(minValue, Math.min(maxValue, newValue));
    this.valueText.text = this.value.toString();
    if (this.options.onChange) {
      this.options.onChange(this.value);
    }
  }
}
