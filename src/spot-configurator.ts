import {FootballRoute, getRouteDetails, getUniqueRouteIdentifier, routeCategories} from "./route-presets";
import {PlayGenerator} from "./index";

const SPOT_SELECTED_CLASS = 'selected';
const SPOT_SET_CLASS = 'set';

export class FieldSpot {
  private domElement: HTMLDivElement;
  private routeDrawer: RouteDrawer;

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

  set route(uniqueRouteIdentifier) {
    this.domElement.dataset['route'] = uniqueRouteIdentifier;

    // draw the route here
    if (uniqueRouteIdentifier) {
      const routeDetails = getRouteDetails(uniqueRouteIdentifier);

      this.routeDrawer.drawRoute(routeDetails);
    } else {
      this.routeDrawer.removeRoute();
    }
  }

  constructor(
      widthPercentage: number,
      heightPercentage: number,
      parent: Element
  ) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('spot');
    this.routeDrawer = new RouteDrawer(this.domElement);

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

class RouteDrawer {
  private canvasContext: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private drawStartPosition = {x: 0, y: 0};
  private strokeProperties = {
    width: 6,
    color: '#0074e8'
  }

  constructor(private parent: HTMLDivElement) {}

  ensureDrawContext () {
    if (this.canvasContext) {
      return this.canvasContext;
    }

    const spotsLayer = this.parent.parentElement;

    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('route-canvas');

    this.canvasContext = this.canvas.getContext('2d');

    // calculate offset and start position for canvas
    this.canvas.style.bottom = `${spotsLayer.offsetHeight -  this.parent.offsetTop}px`;
    this.drawStartPosition = {
      x: this.parent.offsetLeft,
      y: this.canvas.height,
    };

    spotsLayer.appendChild(this.canvas);
  }

  drawRoute(routeDetails: FootballRoute) {
    const YARD_SIZE_IN_PX = PlayGenerator.YARD_SIZE_IN_PX;

    this.ensureDrawContext();
    this.clearRoute();

    const {
      canvasContext,
      drawStartPosition: {x, y},
    } = this;
    let previousPosition = {x, y};

    canvasContext.beginPath();
    canvasContext.lineWidth = this.strokeProperties.width;
    canvasContext.strokeStyle = this.strokeProperties.color;

    canvasContext.moveTo(x, y);

    for (const {moveX, moveY, quadProperties} of routeDetails.moves) {
      let nextPosition = {
        x: previousPosition.x,
        y: previousPosition.y,
      };

      if (moveX !== undefined) {
        nextPosition.x += (moveX * YARD_SIZE_IN_PX);
      }

      if (moveY !== undefined) {
        nextPosition.y -= (moveY * YARD_SIZE_IN_PX);
      }

      if (quadProperties) {
        const controlY = nextPosition.y - (quadProperties.y * YARD_SIZE_IN_PX);
        const controlX = nextPosition.x - (quadProperties.x * YARD_SIZE_IN_PX);

        canvasContext.quadraticCurveTo(controlX, controlY, nextPosition.x, nextPosition.y);
      } else {
        canvasContext.lineTo(nextPosition.x, nextPosition.y);
      }

      previousPosition = nextPosition;
    }

    canvasContext.stroke();
  }

  clearRoute() {
    const {width, height} = this.canvas.getBoundingClientRect();

    this.canvasContext.clearRect(0, 0, width, height);
  }

  removeRoute() {
    if (this.canvasContext === undefined) {
      return;
    }

    this.canvas.remove();

    delete this.canvasContext;
    delete this.canvas;
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

        option.value = getUniqueRouteIdentifier(categoryIdentifier, routeIdentifier);

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
