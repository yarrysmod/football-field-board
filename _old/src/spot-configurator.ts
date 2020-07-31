import {FootballRoute, getRouteDetails, getUniqueRouteIdentifier, routeCategories} from "./route-presets";
import {PlayGenerator} from "./index";

// import '@simonwep/pickr/dist/themes/monolith.min.css'; // TODO
// import Pickr from "@simonwep/pickr";  // 'monolith' theme

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
    if (!this.ensureRouteDraw()) {
      this.routeDrawer.removeRoute();
    }
  }

  get routeColor() {
    return this.domElement.dataset['routeColor'] || '';
  }

  set routeColor(newColor: string) {
    this.domElement.dataset['routeColor'] = newColor;

    this.ensureRouteDraw();
  }

  ensureRouteDraw () {
    if (this.route) {
      const routeDetails = getRouteDetails(this.route);

      this.routeDrawer.drawRoute(routeDetails, undefined, this.routeColor || undefined);

      return true;
    }

    return false;
  }

  constructor(parent: Element) {
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
  static defaultStrokeProperties = {
    width: 6,
    color: '#0074e8'
  };


  private canvasContext: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private drawStartPosition = {x: 0, y: 0};

  constructor(private parent: HTMLDivElement) {
  }

  ensureDrawContext() {
    if (this.canvasContext) {
      return this.canvasContext;
    }

    const spotsLayer = this.parent.parentElement;
    const {width, height} = spotsLayer.getBoundingClientRect();

    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('route-canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    this.canvasContext = this.canvas.getContext('2d');

    // calculate offset and start position for canvas
    this.canvas.style.bottom = `${spotsLayer.offsetHeight - this.parent.offsetTop}px`;
    this.drawStartPosition = {
      x: this.parent.offsetLeft + (this.parent.offsetWidth / 2),
      y: this.canvas.height,
    };

    spotsLayer.appendChild(this.canvas);
  }

  drawRoute(
      routeDetails: FootballRoute,
      lineWidth = RouteDrawer.defaultStrokeProperties.width,
      lineColor = RouteDrawer.defaultStrokeProperties.color,
  ) {
    const YARD_SIZE_IN_PX = PlayGenerator.YARD_SIZE_IN_PX;

    this.ensureDrawContext();
    this.clearRoute();

    const {
      canvasContext,
      drawStartPosition: {x, y},
    } = this;
    let latestPosition = {x, y};
    let previousPosition = {x, y};

    canvasContext.beginPath();
    canvasContext.lineWidth = lineWidth;
    canvasContext.strokeStyle = lineColor;

    canvasContext.moveTo(x, y);

    // Line
    for (const {moveX, moveY, quadProperties} of routeDetails.moves) {
      let nextPosition = {
        x: latestPosition.x,
        y: latestPosition.y,
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

        previousPosition = {
          x: controlX,
          y: controlY,
        };
      } else {
        canvasContext.lineTo(nextPosition.x, nextPosition.y);
      }

      previousPosition = latestPosition;
      latestPosition = nextPosition;
    }

    // Arrow head
    const arrowAngle = Math.atan2(previousPosition.x - latestPosition.x, previousPosition.y - latestPosition.y) + Math.PI;
    const arrowWidth = lineWidth * 4;

    canvasContext.moveTo(
        latestPosition.x - (arrowWidth * Math.sin(arrowAngle - Math.PI / 6)),
        latestPosition.y - (arrowWidth * Math.cos(arrowAngle - Math.PI / 6))
    );

    canvasContext.lineTo(latestPosition.x, latestPosition.y);

    canvasContext.lineTo(
        latestPosition.x - (arrowWidth * Math.sin(arrowAngle + Math.PI / 6)),
        latestPosition.y - (arrowWidth * Math.cos(arrowAngle + Math.PI / 6))
    );

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
    spotRouteColor: HTMLInputElement;
  };
  private resetButton: HTMLButtonElement;

  constructor() {
    this.configPanel = document.querySelector('.config-panel');
    this.inputs = {
      position: this.configPanel.querySelector('input#spotPosition'),
      route: this.configPanel.querySelector('select#spotRoute'),
      spotRouteColor: this.configPanel.querySelector('input#spotRouteColor'),
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

    this.inputs.spotRouteColor.addEventListener('change', () => {
      this.selectedSpot.routeColor = this.inputs.spotRouteColor.value;
    })
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
    const routeColor = this.selectedSpot.routeColor || RouteDrawer.defaultStrokeProperties.color;

    this.inputs.position.value = this.selectedSpot.position;
    this.inputs.route.value = this.selectedSpot.route;
    this.inputs.spotRouteColor.value = routeColor;
    this.configPanel.classList.add(SPOT_EDIT_MODE_CLASS);

    this.inputs.position.focus();
  }
}
