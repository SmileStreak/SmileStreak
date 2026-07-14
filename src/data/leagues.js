export const LEAGUES = [
  {
    id: "bronze",
    name: "Bronze",
    emoji: "🥉",
    color: "#CD7F32",
    promotion: 3,
    demotion: 3,
  },
  {
    id: "silver",
    name: "Silver",
    emoji: "🥈",
    color: "#C0C0C0",
    promotion: 3,
    demotion: 3,
  },
  {
    id: "gold",
    name: "Gold",
    emoji: "🥇",
    color: "#FFD700",
    promotion: 3,
    demotion: 3,
  },
  {
    id: "platinum",
    name: "Platinum",
    emoji: "💠",
    color: "#5ED3F3",
    promotion: 3,
    demotion: 3,
  },
  {
    id: "diamond",
    name: "Diamond",
    emoji: "💎",
    color: "#50C8FF",
    promotion: 3,
    demotion: 3,
  },
  {
    id: "champion",
    name: "Champion",
    emoji: "👑",
    color: "#9C27B0",
    promotion: 0,
    demotion: 3,
  },
];

export function getLeague(id) {
  return LEAGUES.find((league) => league.id === id);
}

export function getNextLeague(id) {
  const index = LEAGUES.findIndex((league) => league.id === id);
  if (index === -1 || index === LEAGUES.length - 1) return null;
  return LEAGUES[index + 1];
}

export function getPreviousLeague(id) {
  const index = LEAGUES.findIndex((league) => league.id === id);
  if (index <= 0) return null;
  return LEAGUES[index - 1];
}
