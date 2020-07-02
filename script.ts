const SPOT_SELECTED_CLASS = 'selected';
const SPOT_SET_CLASS = 'set';

class FieldSpot {
  private domElement: HTMLDivElement;

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
}

class FieldGenerator {
  spotsField: Element;
  spots: Array<FieldSpot> = [];
  private spotConfigurator: SpotConfigurator;
  private _selectedSpot: FieldSpot;

  get selectedSpot() {
    return this._selectedSpot;
  }

  set selectedSpot(spot: FieldSpot) {
    const hasNoInitialValue = this._selectedSpot === undefined;

    if (hasNoInitialValue) {
      this._selectedSpot = spot;
      this._selectedSpot.isSelected = true;
      return;
    }

    const isSameSpotAsBefore = this._selectedSpot === spot;

    if (isSameSpotAsBefore) {
      this._selectedSpot.isSelected = false;
      this._selectedSpot = undefined;
    } else {
      this._selectedSpot.isSelected = false;
      this._selectedSpot = spot;
      this._selectedSpot.isSelected = true;
    }
  }

  constructor(spotsCount: number) {
    this.spotsField = document.querySelector('.spots-layer');
    this.spotConfigurator = new SpotConfigurator();

    const {
      width: fieldWidth,
      height: fieldHeight,
    } = this.spotsField.getBoundingClientRect();

    const spotLength = fieldWidth / spotsCount;
    const rowCount = Math.floor(fieldHeight / spotLength);

    const spotWidthPercentage = 100 / spotsCount;
    const spotHeightPercentage = 100 / rowCount;

    this.defineSpotStyle(spotWidthPercentage, spotHeightPercentage);

    for (let rowNum = 0; rowNum < rowCount; rowNum += 1) {
      for (let spotNum = 0; spotNum < spotsCount; spotNum += 1) {
        this.spots.push(
            new FieldSpot(
                spotWidthPercentage,
                spotHeightPercentage,
                this.spotsField
            )
        );
      }
    }

    this.spotsField.addEventListener(
        'spotSelected',
        (customEvent: CustomEvent<FieldSpot>) => this.processSpotSelection(customEvent)
    );
  }

  defineSpotStyle(spotWidthPercentage: number, spotHeightPercentage: number) {
    let spotStyle = document.createElement('style');

    spotStyle.appendChild(new Text(`.spot {
      width: ${spotWidthPercentage}%;
      height: ${spotHeightPercentage}%;
    }`));

    document.head.appendChild(spotStyle);
  }

  private processSpotSelection({detail: fieldSpot}: CustomEvent<FieldSpot>) {
    this.selectedSpot = fieldSpot;
    this.spotConfigurator.processSelectedSpot(this.selectedSpot);
  }
}

const EDIT_MODE_CLASS = 'has-selection';

interface FootballRoute {
  identifier: string;
  name: string;
}

interface RouteCategory {
  identifier: string;
  name: string;
  routes: FootballRoute[];
}

type genericRoutesList = 'five_o' | 'five_i' | 'go';
const genericRoutes: { [key in genericRoutesList]: FootballRoute } = {
  five_o: {
    identifier: 'five_o',
    name: 'Five out',
  },
  five_i: {
    identifier: 'five_i',
    name: 'Five In',
  },
  go: {
    identifier: 'go',
    name: 'Go',
  },
};

const routeCategories: RouteCategory[] = [
  {
    identifier: 'l_plays',
    name: 'Routes from the left',
    routes: [
      genericRoutes.five_o,
      genericRoutes.five_i,
    ]
  },
  {
    identifier: 'c_plays',
    name: 'Unidirection routes',
    routes: [
      genericRoutes.go,
    ]
  },
  {
    identifier: 'r_plays',
    name: 'Routes from the right',
    routes: [
      genericRoutes.five_o,
      genericRoutes.five_i,
    ]
  },
];

class SpotConfigurator {
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
      this.inputs.position.value = '';
      this.inputs.position.dispatchEvent(new Event('input'));

      this.inputs.route.value = '';
      this.inputs.position.dispatchEvent(new Event('change'));
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
    this.configPanel.classList.remove(EDIT_MODE_CLASS);
  }

  private initializeConfigurator() {
    this.inputs.position.value = this.selectedSpot.position;
    this.inputs.route.value = this.selectedSpot.route;
    this.configPanel.classList.add(EDIT_MODE_CLASS);

    this.inputs.position.focus();
  }
}


new FieldGenerator(11);
