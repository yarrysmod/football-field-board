export type StoredSpots = {
  [key: number]: {
    position: string;
    route: string;
  }
};

export interface StoredPlayData {
  playName: string;
  createdAt: number;
  updatedAt?: number;
  spots: StoredSpots;
}

export const CREATED_PREFIX = 'created at ';
export const UPDATED_PREFIX = 'updated at ';

export class PlayStorageManager {
  private playsWrapper: Element;
  private playsContainer: {
    [key: string]: {
      domElement: Element,
      rawData: StoredPlayData,
    }
  } = {};
  public eventEmitter: HTMLDivElement;

  constructor() {
    this.eventEmitter = document.createElement('div');
    this.playsWrapper = document.querySelector('.plays-wrapper');

    this.populatePlays();
  }

  private populatePlays() {
    for (const playIdentifier of Object.keys(localStorage)) {
      const playData: StoredPlayData = JSON.parse(localStorage.getItem(playIdentifier));

      this.addPlay(playIdentifier, playData);
    }
  }

  private addPlay(playIdentifier: string, playData: StoredPlayData) {
    const playContainer = document.createElement('div');
    const playTitle = document.createElement('span');
    const buttons = {
      load: document.createElement('button'),
      remove: document.createElement('button'),
    };

    playContainer.classList.add('play-row');

    playTitle.textContent = playData.playName;
    playContainer.appendChild(playTitle);

    buttons.load.textContent = 'Load';
    buttons.load.classList.add('load-button', 'save');
    buttons.load.addEventListener(
        'click',
        () => {
          const playData = this.playsContainer[playIdentifier].rawData;

          this.eventEmitter.dispatchEvent(new CustomEvent('loadPlay', {
            detail: {
              playData,
              playIdentifier,
            }
          }));
        }
    );
    playContainer.appendChild(buttons.load);

    buttons.remove.textContent = 'Remove';
    buttons.remove.classList.add('remove-button', 'reset');
    buttons.remove.addEventListener('click', () => this.removePlay(playIdentifier));
    playContainer.appendChild(buttons.remove);

    this.playsWrapper.appendChild(playContainer);
    this.playsContainer[playIdentifier] = {
      domElement: playContainer,
      rawData: playData,
    }
  }

  private updatePlay(playIdentifier: string, playData: StoredPlayData) {
    const playContainer = this.playsContainer[playIdentifier];

    playContainer.rawData = playData;
  }

  private removePlay(playIdentifier: string) {
    const playContainer = this.playsContainer[playIdentifier];

    playContainer.domElement.remove();
    localStorage.removeItem(playIdentifier);
    delete this.playsContainer[playIdentifier];
  }

  updatePlayData(
      playIdentifier: string,
      playName: string,
      spots: StoredSpots,
      currentTimestamp: number
  ) {
    let previousPlayData = localStorage.getItem(playIdentifier);
    const isNewPlay = previousPlayData === null;
    let playData: StoredPlayData;

    if (isNewPlay) {
      playData = {
        spots,
        playName,
        createdAt: currentTimestamp,
      };

      this.addPlay(playIdentifier, playData);
    } else {
      playData = Object.assign(JSON.parse(previousPlayData), {
        spots,
        playName,
        updatedAt: currentTimestamp,
      });

      this.updatePlay(playIdentifier, playData);
    }

    localStorage.setItem(playIdentifier, JSON.stringify(playData));
  }
}
