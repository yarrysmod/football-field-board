import {routeCategories} from "./route-presets";

const SPOT_SELECTED_CLASS = 'selected';
const SPOT_SET_CLASS = 'set';

export class FieldSpot {
  private domElement: HTMLDivElement;
  private spotRoute: SpotRoute; // TODO

  set isSelected(value: boolean) {
    this.domElement.classList.toggle(SPOT_SELECTED_CLASS, value);
  }

  get position() {
    return this.domElement.dataset['position'] || '';
  }

  set position(newPosition) {
    this.domElement.dataset['position'] = newPosition;
    this.domElement.classList.toggle(SPOT_SET_CLASS, newPosition !== '');
  }

  get route() {
    return this.domElement.dataset['route'] || '';
  }

  set route(newRoute) {
    this.domElement.dataset['route'] = newRoute;
  }

  constructor(
      widthPercentage: number,
      heightPercentage: number,
      parent: Element
  ) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('spot');

    parent.appendChild(this.domElement);

    this.domElement.addEventListener('click', () => {
      let event = new CustomEvent('spotSelected', {
        detail: this
      });
      parent.dispatchEvent(event);
    });
  }

  deselect() {
    this.domElement.dispatchEvent(new Event('click'));
  }

  reset() {
    this.position = '';
    this.route = '';
  }
}

class SpotRoute extends HTMLCanvasElement { // TODO
  private canvasContext: CanvasRenderingContext2D;

  constructor() {
    super();

    this.canvasContext = this.getContext('2d');
  }

  drawRoute() {
  }

  removeRoute() {
  }
}

const SPOT_EDIT_MODE_CLASS = 'has-selection';

export class SpotConfigurator {
  private selectedSpot: FieldSpot;
  private configPanel: Element;
  private inputs: {
    route: HTMLSelectElement;
    position: HTMLInputElement;
  };
  private resetButton: HTMLButtonElement;

  constructor() {
    this.configPanel = document.querySelector('.config-panel');
    this.inputs = {
      position: this.configPanel.querySelector('input#spotPosition'),
      route: this.configPanel.querySelector('select#spotRoute'),
    };
    this.resetButton = this.configPanel.querySelector('button#spotReset');

    this.populateRoutes();

    this.inputs.position.addEventListener('input', () => {
      this.selectedSpot.position = this.inputs.position.value;
    });

    this.inputs.route.addEventListener('change', () => {
      this.selectedSpot.route = this.inputs.route.value;
    });

    this.resetButton.addEventListener('click', () => {
      this.selectedSpot.reset();
      this.selectedSpot.deselect();
    });
  }

  private populateRoutes() {
    const routeSelect = this.inputs.route;

    for (const category of routeCategories) {
      const {
        name: categoryName,
        identifier: categoryIdentifier,
        routes,
      } = category;
      const optionGroup = document.createElement('optgroup');

      optionGroup.label = categoryName;

      for (const route of routes) {
        const {
          name: routeName,
          identifier: routeIdentifier,
        } = route;
        const option = document.createElement('option');

        option.label = routeName;
        option.value = `${categoryIdentifier}#${routeIdentifier}`;

        optionGroup.appendChild(option);
      }

      routeSelect.appendChild(optionGroup);
    }
  }

  processSelectedSpot(selectedSpot: FieldSpot) {
    this.selectedSpot = selectedSpot;

    if (!this.selectedSpot) {
      this.resetConfigurator();
    } else {
      this.initializeConfigurator();
    }
  }

  resetConfigurator() {
    this.configPanel.classList.remove(SPOT_EDIT_MODE_CLASS);
  }

  private initializeConfigurator() {
    this.inputs.position.value = this.selectedSpot.position;
    this.inputs.route.value = this.selectedSpot.route;
    this.configPanel.classList.add(SPOT_EDIT_MODE_CLASS);

    this.inputs.position.focus();
  }
}
