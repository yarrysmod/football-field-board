import {PlayStorageManager, StoredPlayData, StoredSpots} from "./play-manager";
import {LineConfigurator, LinesData} from "./line-configurator";
import {FieldSpot, SpotConfigurator} from "./spot-configurator";

class PlayGenerator {
  private playField: Element;
  private playNameInput: HTMLInputElement;

  private spots: Array<FieldSpot> = [];
  private spotConfigurator: SpotConfigurator;
  private lineConfiguration: LineConfigurator;
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
    this.lineConfiguration = new LineConfigurator();

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
    const linesData = playConfiguration?.linesData || {} as LinesData;

    this.playIdentifier = playIdentifier;
    this.playName = playConfiguration?.playName;

    this.lineConfiguration.initData(linesData);

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
    const linesData = this.lineConfiguration.getData();

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
        linesData,
        currentTimestamp
    );
  }
}

new PlayGenerator(11);
