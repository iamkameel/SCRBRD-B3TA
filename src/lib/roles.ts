
export const ROLE_GROUPS = [
  { 
    group: "Administrative", 
    roles: [ 
      { id: "Admin", label: "Admin", description: "Has full system access. Can manage all data including users, schools, and system-wide settings. Intended for the highest level of control." }, 
      { id: "Sportsmaster", label: "Sportsmaster", description: "Oversees multiple schools or a district. Manages competitions, teams, and personnel within their assigned scope. Reviews and approves assignment requests." },
      { id: "School Admin", label: "School Admin", description: "Manages all aspects of a single school, including assigning coaches and managing teams associated with that school." } 
    ] 
  },
  { 
    group: "Team Staff", 
    roles: [ 
      { id: "Coach", label: "Coach", description: "Manages a specific team's roster, training sessions, and match day strategy. Can edit lineups and view detailed player analytics." }, 
      { id: "Assistant Coach", label: "Assistant Coach", description: "Supports the Head Coach in training, player development, and match day operations. Has similar but slightly restricted permissions." }, 
      { id: "Team Manager", label: "Team Manager", description: "The operational backbone of a team, handling all non-technical logistics like availability, transport, and communications to free coaches to focus on performance." },
      { id: "Captain", label: "Captain", description: "The on-field leader of the team. Can confirm final lineups and has access to strategic team data." }
    ] 
  },
  { 
    group: "Players & Spectators", 
    roles: [ 
      { id: "Player", label: "Player", description: "A member of a team roster. Can view their personal stats, upcoming fixtures, and team information. Can set their own availability for matches." }, 
      { id: "Guardian", label: "Guardian", description: "A parent or legal guardian linked to one or more players. Can view their children's schedules, team info, and manage their availability." },
      { id: "Spectator", label: "Spectator", description: "A general user with read-only access to public-facing information like match results, fixtures, and league rankings." } 
    ] 
  },
  { 
    group: "Support & Medical", 
    roles: [ 
      { id: "Trainer", label: "Trainer", description: "Manages player fitness, conditioning programs, and tracks physical development." }, 
      { id: "Physiotherapist", label: "Physiotherapist", description: "Manages player injuries, rehabilitation, and provides medical support during matches." }, 
      { id: "Doctor", label: "Doctor", description: "A medical professional available for consultation and emergency support." }, 
      { id: "First Aid", label: "First Aid", description: "Certified first-aid provider assigned to be present at matches for immediate medical assistance." } 
    ] 
  },
  { 
    group: "Officials & Ground Staff", 
    roles: [ 
      { id: "Umpire", label: "Umpire", description: "Officiates matches, makes on-field decisions, and can use tools like the AI Umpire Review." },
      { id: "Scorer", label: "Scorer", description: "Records ball-by-ball data during a live match using the live scoring interface." }, 
      { id: "Grounds-Keeper", label: "Grounds-Keeper", description: "Manages the status and condition of assigned fields and venues." },
      { id: "Driver", label: "Driver", description: "Assigned to transport teams to and from matches. Can view their transport schedule." }
    ] 
  },
];
