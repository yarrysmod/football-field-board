class FieldSpot {
  private domElement: HTMLDivElement;

  set isSelected(value: boolean) {
    this.domElement.classList.toggle('set', value);
  }

  get position () {
    return this.domElement.getAttribute('data-position') || '';
  }

  set position (newPosition) {
    this.domElement.setAttribute('data-position', newPosition);
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

    if(isSameSpotAsBefore) {
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

class SpotConfigurator {
  private selectedSpot: FieldSpot;
  private configPanel: Element;
  private inputs: {
    route: Element;
    position: Element;
  };

  constructor() {
    this.configPanel = document.querySelector('.config-panel');
    this.inputs = {
      position: this.configPanel.querySelector('input#spotPosition'),
      route: this.configPanel.querySelector('input#spotRoute'),
    }
  }

  processSelectedSpot(selectedSpot: FieldSpot) {
    if (!selectedSpot) {
      this.selectedSpot = undefined;
      this.resetConfigurator();
    }
  }

  resetConfigurator() {}
}


new FieldGenerator(11);
