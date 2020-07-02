const SPOT_SELECTED_CLASS = 'selected';
const SPOT_SET_CLASS = 'set';

class FieldSpot {
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

type StoredSpots = {
  [key: number]: {
    position: string;
    route: string;
  }
};

interface StoredPlayData {
  playName: string;
  createdAt: number;
  updatedAt?: number;
  spots: StoredSpots;
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

class PlayGenerator {
  private playField: Element;
  private playNameInput: HTMLInputElement;

  private spots: Array<FieldSpot> = [];
  private spotConfigurator: SpotConfigurator;
  private _selectedSpot: FieldSpot;
  private buttons: {
    savePlay: HTMLButtonElement;
    resetPlay: HTMLButtonElement;
  };

  private playStoreManager = new PlayStorageManager();
  public playIdentifier: string;

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

  set playName(newPlayName) {
    this.playNameInput.value = newPlayName || '';
  }

  get playName() {
    return this.playNameInput.value;
  }

  constructor(
      spotsCount: number
  ) {
    this.playField = document.querySelector('.spots-layer');
    this.playNameInput = document.querySelector('input#playName');
    this.buttons = {
      resetPlay: document.querySelector('button#playReset'),
      savePlay: document.querySelector('button#playSave'),
    };
    this.spotConfigurator = new SpotConfigurator();

    const {
      width: fieldWidth,
      height: fieldHeight,
    } = this.playField.getBoundingClientRect();

    const spotLength = fieldWidth / spotsCount;
    const rowCount = Math.floor(fieldHeight / spotLength);
    const widthPercentage = 100 / spotsCount;
    const heightPercentage = 100 / rowCount;

    this.defineSpotStyle(widthPercentage, heightPercentage);
    this.populateSpots(rowCount, spotsCount, {widthPercentage, heightPercentage})

    this.playField.addEventListener(
        'spotSelected',
        (customEvent: CustomEvent<FieldSpot>) => this.processSpotSelection(customEvent)
    );
    this.buttons.resetPlay.addEventListener('click', () => this.reloadPlay());
    this.buttons.savePlay.addEventListener('click', () => this.savePlay());
  }

  public populateSpots(
      rowCount: number,
      spotsCount: number,
      spotDimensions: {
        widthPercentage: number;
        heightPercentage: number;
      }
  ) {
    for (let rowNum = 0; rowNum < rowCount; rowNum += 1) {
      for (let spotNum = 0; spotNum < spotsCount; spotNum += 1) {
        this.spots.push(
            new FieldSpot(
                spotDimensions.widthPercentage,
                spotDimensions.heightPercentage,
                this.playField
            )
        );
      }
    }
  }

  public defineSpotStyle(spotWidthPercentage: number, spotHeightPercentage: number) {
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

  public reloadPlay(playConfiguration?: StoredPlayData, playIdentifier?: string): void {
    if (this.selectedSpot !== undefined) {
      this.selectedSpot.deselect();
    }

    const configuredSpots = playConfiguration?.spots || {};

    this.playIdentifier = playIdentifier;
    this.playName = playIdentifier;

    for (const spot of this.spots) {
      spot.reset();
    }

    for (const spotEntry of Object.entries(configuredSpots)) {
      const spotIndex = Number(spotEntry[0]);
      const spotConfiguration = spotEntry[1];
      const selectedSpot = this.spots[spotIndex];

      selectedSpot.position = spotConfiguration.position;
      selectedSpot.route = spotConfiguration.route;
    }
  }

  public savePlay() {
    const playName = this.playName;

    if (!playName) {
      return window.alert('Please define a play name before saving.');
    }

    const spots = this.spots
        .reduce((storedSpots, {route, position}, index): StoredSpots => {
          if (position) {
            storedSpots[index] = {route, position}
          }

          return storedSpots;
        }, {} as StoredSpots);

    if (!Object.keys(spots).length) {
      return window.alert(`Please define positions before saving.`);
    }

    const currentTimestamp = Date.now();

    if (!this.playIdentifier) {
      this.playIdentifier = `${playName}+${currentTimestamp}`;
    }

    this.playStoreManager.updatePlayData(
        this.playIdentifier,
        this.playName,
        spots,
        currentTimestamp
    );

  }
}

class PlayStorageManager {
  updatePlayData(
      playIdentifier: string,
      playName: string,
      spots: StoredSpots,
      currentTimestamp: number
  ) {
    let previousPlayData = localStorage.getItem(playIdentifier);
    let playData: StoredPlayData;

    if (!previousPlayData) {
      playData = {
        spots,
        playName,
        createdAt: currentTimestamp,
      };
    } else {
      playData = Object.assign({
        spots,
        playName,
        updatedAt: currentTimestamp,
      }, JSON.parse(previousPlayData));
    }

    localStorage.setItem(playIdentifier, JSON.stringify(playData));
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
    this.configPanel.classList.remove(EDIT_MODE_CLASS);
  }

  private initializeConfigurator() {
    this.inputs.position.value = this.selectedSpot.position;
    this.inputs.route.value = this.selectedSpot.route;
    this.configPanel.classList.add(EDIT_MODE_CLASS);

    this.inputs.position.focus();
  }
}


new PlayGenerator(11);
