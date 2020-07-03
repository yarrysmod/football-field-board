import {routeCategories} from "./route-presets";
import {PlayStorageManager, StoredPlayData, StoredSpots} from "./play-manager";

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

  private playManager = new PlayStorageManager();
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

    this.playManager.eventEmitter.addEventListener('loadPlay', ({detail}: CustomEvent<{playData: StoredPlayData, playIdentifier: string}>) => {
      this.reloadPlay(detail.playIdentifier, detail.playData);
    })
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

  public reloadPlay(playIdentifier?: string, playConfiguration?: StoredPlayData): void {
    if (this.selectedSpot !== undefined) {
      this.selectedSpot.deselect();
    }

    const configuredSpots = playConfiguration?.spots || {};

    this.playIdentifier = playIdentifier;
    this.playName = playConfiguration?.playName;

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

    this.playManager.updatePlayData(
        this.playIdentifier,
        this.playName,
        spots,
        currentTimestamp
    );
  }
}

const EDIT_MODE_CLASS = 'has-selection';

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
