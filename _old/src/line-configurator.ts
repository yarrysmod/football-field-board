export type LinesData = { display: boolean; position: string };

const DEFAULT_LINE_POSITION = '22';

export class LineConfigurator {
  private linesLayer: HTMLDivElement;
  private linesContainer: HTMLDivElement;
  private inputs: {
    scrimmageSlider: HTMLInputElement;
    toggleLinesCheckbox: HTMLInputElement;
  };

  constructor() {
    this.linesLayer = document.querySelector<HTMLDivElement>('.lines-layer');
    this.linesContainer = document.querySelector<HTMLDivElement>('.lines-container');
    this.inputs = {
      scrimmageSlider: document.querySelector<HTMLInputElement>('input.scrimmage-slider'),
      toggleLinesCheckbox: document.querySelector<HTMLInputElement>('input#togglePlayLines'),
    }

    this.inputs.scrimmageSlider.addEventListener('input', () => {
      this.position = this.inputs.scrimmageSlider.value;
    });
    this.inputs.scrimmageSlider.dispatchEvent(new Event('input'));

    this.inputs.toggleLinesCheckbox.addEventListener('input', () => {
      this.display = this.inputs.toggleLinesCheckbox.checked;
    });
    this.inputs.toggleLinesCheckbox.dispatchEvent(new Event('input'));
  }

  get position() {
    return this.linesContainer.dataset['position'] || '';
  }

  set position(position) {
    // data
    this.linesContainer.dataset['position'] = position;

    // UI
    const {height: maxHeight} = this.linesLayer.getBoundingClientRect();
    const bottomDiff = maxHeight * (Number(position) / 100);

    this.linesContainer.style.bottom = `${bottomDiff}px`;
  }

  get display() {
    return this.linesContainer.dataset['display'] === '1';
  }

  set display(display: boolean) {
    // data
    this.linesContainer.dataset['display'] = display ? '1' : '0';

    // UI
    this.linesLayer.style.visibility = display ? 'visible' : 'hidden';
    this.inputs.scrimmageSlider.style.display = display ? 'block' : 'none';
  }

  getData(): LinesData {
    return {
      display: this.display,
      position: this.position,
    }
  }

  initData(linesData: LinesData) {
    const {
      display,
      position,
    } = linesData || {};

    const {
      scrimmageSlider,
      toggleLinesCheckbox,
    } = this.inputs;

    scrimmageSlider.value = position !== undefined ? position : DEFAULT_LINE_POSITION;
    scrimmageSlider.dispatchEvent(new Event('input'));

    toggleLinesCheckbox.checked = display || false;
    toggleLinesCheckbox.dispatchEvent(new Event('input'));
  }
}
