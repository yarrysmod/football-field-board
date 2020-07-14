export interface RouteMove {
  moveX?: number;
  moveY?: number;

  quadProperties?: {
    x: number;
    y: number;
  };
}

export interface FootballRoute {
  identifier: string;
  name: string;

  moves: RouteMove[];
}

interface RouteCategory {
  identifier: string;
  name: string;
  routes: FootballRoute[];
}

type genericRoutesList = 'five_o' | 'five_i' | 'ten_o' | 'ten_i' | 'go' | 'wheel' | 'corner' | 'post' | 'slant' | 'hitch' | 'comeback';

const genericRoutes: { [key in genericRoutesList]: FootballRoute } = {
  five_o: {
    identifier: 'five_o',
    name: 'Five out',
    moves: [
      {moveY: 5},
      {moveX: -5},
    ],
  },
  five_i: {
    identifier: 'five_i',
    name: 'Five In',
    moves: [
      {moveY: 5},
      {moveX: 5},
    ],
  },
  go: {
    identifier: 'go',
    name: 'Go',
    moves: [
      {moveY: 15},
    ]
  },
  wheel: {
    identifier: 'wheel',
    name: 'Wheel Route',
    moves: [
      {
        moveY: 3,
        moveX: 1,
        quadProperties: {
          y: 0,
          x: 1,
        }
      },
      {
        moveY: 3,
        moveX: 18,
        quadProperties: {
          y: -4,
          x: 1,
        }
      },
      {
        moveY: 10,
      }
    ]
  },
  ten_o: {
    identifier: 'ten_o',
    name: 'Ten out',
    moves: [
      {moveY: 10},
      {moveX: -5},
    ],
  },
  ten_i: {
    identifier: 'ten_i',
    name: 'Ten In',
    moves: [
      {moveY: 10},
      {moveX: 5},
    ],
  },
  corner: {
    identifier: 'corner',
    name: 'Corner',
    moves: [
      {moveY: 10},
      {
        moveX: 3,
        moveY: 5,
      }
    ]
  },
  post: {
    identifier: 'post',
    name: 'Post',
    moves: [
      {moveY: 10},
      {
        moveX: -3,
        moveY: 5,
      }
    ]
  },
  slant: {
    identifier: 'slant',
    name: 'Slant',
    moves: [
      {moveY: 2},
      {moveX: 10, moveY: 10},
    ],
  },
  comeback: {
    identifier: 'comeback',
    name: 'Comeback',
    moves: [
      {moveY: 10},
      {
        moveY: -2,
        moveX: -2,
      }
    ]
  },
  hitch: {
    identifier: 'hitch',
    name: 'Hitch',
    moves: [
      {moveY: 5},
      {
        moveY: -2,
        moveX: -2,
      }
    ]
  },
};

const reverseRoute = (route: FootballRoute, doReverseX = false, doReverseY = false) => {
  if (doReverseX === false && doReverseY) {
    return route;
  }

  const routeCopy = Object.assign({}, route);
  const newMoves: RouteMove[] = [];

  for (const move of routeCopy.moves) {
    const moveCopy = Object.assign({}, move);

    if (moveCopy.moveX !== undefined && doReverseX) {
      moveCopy.moveX = -moveCopy.moveX;
    }

    if (moveCopy.moveY !== undefined && doReverseY) {
      moveCopy.moveY = -moveCopy.moveY;
    }

    if (moveCopy.quadProperties) {
      moveCopy.quadProperties = Object.assign({}, move.quadProperties);

      if (doReverseX) {
        moveCopy.quadProperties.x = -moveCopy.quadProperties.x;
      }

      if (doReverseY) {
        moveCopy.quadProperties.y = -moveCopy.quadProperties.y;
      }
    }

    newMoves.push(moveCopy);
  }

  routeCopy.moves = newMoves;

  return routeCopy;
};

const ROUTE_CATEGORY_SEPARATOR = `#`;

export const routeCategories: RouteCategory[] = [
  {
    identifier: 'l_plays',
    name: 'Routes from the left',
    routes: [
      genericRoutes.five_o,
      genericRoutes.five_i,
      genericRoutes.wheel,

      genericRoutes.ten_o,
      genericRoutes.ten_i,

      genericRoutes.corner,
      genericRoutes.post,
      genericRoutes.slant,

      genericRoutes.hitch,
      genericRoutes.comeback,
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
      reverseRoute(genericRoutes.five_o, true),
      reverseRoute(genericRoutes.five_i, true),
      reverseRoute(genericRoutes.wheel, true),

      reverseRoute(genericRoutes.ten_i, true),
      reverseRoute(genericRoutes.ten_o, true),

      reverseRoute(genericRoutes.corner, true),
      reverseRoute(genericRoutes.post, true),
      reverseRoute(genericRoutes.slant, true),

      reverseRoute(genericRoutes.hitch, true),
      reverseRoute(genericRoutes.comeback, true),
    ]
  },
];

export const getUniqueRouteIdentifier = (categoryIdentifier: string, routeIdentifier: string) => {
  return `${categoryIdentifier}${ROUTE_CATEGORY_SEPARATOR}${routeIdentifier}`;
};

export const getRouteDetails = (uniqueRouteIdentifier: string) => {
  const [categoryIdentifier, routeIdentifier] = uniqueRouteIdentifier.split(ROUTE_CATEGORY_SEPARATOR);

  return routeCategories
      .find(({identifier}) => identifier === categoryIdentifier)
      .routes.find(({identifier}) => identifier === routeIdentifier);
};
