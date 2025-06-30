

export const ROLE_GROUPS = [
  { group: "Administrative", roles: [ { id: "Admin", label: "Admin" }, { id: "Sportsmaster", label: "Sportsmaster" }, { id: "School Admin", label: "School Admin" } ] },
  { group: "Team Staff", roles: [ { id: "Coach", label: "Coach" }, { id: "Assistant Coach", label: "Assistant Coach" }, { id: "Captain", label: "Captain" }, { id: "Team Manager", label: "Team Manager" } ] },
  { group: "Players & Spectators", roles: [ { id: "Player", label: "Player" }, { id: "Guardian", label: "Guardian" }, { id: "Spectator", label: "Spectator" } ] },
  { group: "Support & Medical", roles: [ { id: "Trainer", label: "Trainer" }, { id: "Physiotherapist", label: "Physiotherapist" }, { id: "Doctor", label: "Doctor" }, { id: "Chiropractor", label: "Chiropractor" }, { id: "Nutritionist", label: "Nutritionist" }, { id: "First Aid", label: "First Aid" } ] },
  { group: "Officials & Ground Staff", roles: [ { id: "Umpire", label: "Umpire" }, { id: "Scorer", label: "Scorer" }, { id: "Grounds-Keeper", label: "Grounds-Keeper" }, { id: "Driver", label: "Driver" } ] },
];
