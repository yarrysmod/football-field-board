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

export const routeCategories: RouteCategory[] = [
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
