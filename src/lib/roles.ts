
import type { RoleScope } from './data';

export const ALL_ROLES = [
    // Administrative
    { roleId: '1', code: 'SYSTEM_ARCHITECT', label: 'System Architect', description: 'Has unparalleled access and control over all system functionalities.', roleCategoryId: 'cat_admin', defaultScope: 'SYSTEM', isAssignable: false },
    { roleId: '2', code: 'ADMIN', label: 'Admin', description: 'Has full system access to manage all data.', roleCategoryId: 'cat_admin', defaultScope: 'SYSTEM', isAssignable: true },
    { roleId: '3', code: 'SPORTSMASTER', label: 'Sportsmaster', description: 'Oversees multiple schools or a district.', roleCategoryId: 'cat_admin', defaultScope: 'SCHOOL', isAssignable: true },
    { roleId: '4', code: 'SCHOOL_ADMIN', label: 'School Admin', description: 'Manages all aspects of a single school.', roleCategoryId: 'cat_admin', defaultScope: 'SCHOOL', isAssignable: true },
    // Team Staff
    { roleId: '5', code: 'COACH', label: 'Coach', description: 'Manages a specific team\'s roster and strategy.', roleCategoryId: 'cat_team', defaultScope: 'TEAM', isAssignable: true },
    { roleId: '6', code: 'ASSISTANT_COACH', label: 'Assistant Coach', description: 'Supports the Head Coach.', roleCategoryId: 'cat_team', defaultScope: 'TEAM', isAssignable: true },
    { roleId: '7', code: 'TEAM_MANAGER', label: 'Team Manager', description: 'Handles team logistics and operations.', roleCategoryId: 'cat_team', defaultScope: 'TEAM', isAssignable: true },
    { roleId: '8', code: 'CAPTAIN', label: 'Captain', description: 'The on-field leader of the team.', roleCategoryId: 'cat_team', defaultScope: 'TEAM', isAssignable: true },
    // Players & Spectators
    { roleId: '9', code: 'PLAYER', label: 'Player', description: 'A member of a team roster.', roleCategoryId: 'cat_player', defaultScope: 'TEAM', isAssignable: true },
    { roleId: '10', code: 'GUARDIAN', label: 'Guardian', description: 'A parent or guardian linked to a player.', roleCategoryId: 'cat_player', defaultScope: 'PERSON', isAssignable: true },
    { roleId: '11', code: 'SPECTATOR', label: 'Spectator', description: 'A general user with read-only access.', roleCategoryId: 'cat_player', defaultScope: 'SYSTEM', isAssignable: true },
    // Support & Medical
    { roleId: '12', code: 'TRAINER', label: 'Trainer', description: 'Manages player fitness and conditioning.', roleCategoryId: 'cat_support', defaultScope: 'TEAM', isAssignable: true },
    { roleId: '13', code: 'PHYSIOTHERAPIST', label: 'Physiotherapist', description: 'Manages player injuries and rehabilitation.', roleCategoryId: 'cat_support', defaultScope: 'TEAM', isAssignable: true },
    { roleId: '14', code: 'DOCTOR', label: 'Doctor', description: 'Medical professional for consultation.', roleCategoryId: 'cat_support', defaultScope: 'FIXTURE', isAssignable: true },
    { roleId: '15', code: 'FIRST_AID', label: 'First Aid', description: 'Certified first-aid provider for matches.', roleCategoryId: 'cat_support', defaultScope: 'FIXTURE', isAssignable: true },
    // Officials & Ground Staff
    { roleId: '16', code: 'UMPIRE', label: 'Umpire', description: 'Officiates matches.', roleCategoryId: 'cat_official', defaultScope: 'FIXTURE', isAssignable: true },
    { roleId: '17', code: 'SCORER', label: 'Scorer', description: 'Records ball-by-ball data during a live match.', roleCategoryId: 'cat_official', defaultScope: 'FIXTURE', isAssignable: true },
    { roleId: '18', code: 'GROUNDS_KEEPER', label: 'Grounds-Keeper', description: 'Manages the status and condition of fields.', roleCategoryId: 'cat_official', defaultScope: 'FACILITY', isAssignable: true },
    { roleId: '19', code: 'DRIVER', label: 'Driver', description: 'Assigned to transport teams.', roleCategoryId: 'cat_official', defaultScope: 'TRIP', isAssignable: true },
];

export const ROLE_CATEGORIES = [
    { roleCategoryId: 'cat_admin', code: 'ADMINISTRATIVE', name: 'Administrative', displayOrder: 1 },
    { roleCategoryId: 'cat_team', code: 'TEAM_STAFF', name: 'Team Staff', displayOrder: 2 },
    { roleCategoryId: 'cat_player', code: 'PLAYERS_SPECTATORS', name: 'Players & Spectators', displayOrder: 3 },
    { roleCategoryId: 'cat_support', code: 'SUPPORT_MEDICAL', name: 'Support & Medical', displayOrder: 4 },
    { roleCategoryId: 'cat_official', code: 'OFFICIALS_GROUND', name: 'Officials & Ground Staff', displayOrder: 5 },
];

// This remains for UI grouping in some components, but the source of truth is now ALL_ROLES and ROLE_CATEGORIES.
export const ROLE_GROUPS = [
  { 
    group: "Administrative", 
    roles: ALL_ROLES.filter(r => r.roleCategoryId === 'cat_admin').map(({roleId: id, label, description}) => ({id, label, description}))
  },
  { 
    group: "Team Staff", 
    roles: ALL_ROLES.filter(r => r.roleCategoryId === 'cat_team').map(({roleId: id, label, description}) => ({id, label, description}))
  },
  { 
    group: "Players & Spectators", 
    roles: ALL_ROLES.filter(r => r.roleCategoryId === 'cat_player').map(({roleId: id, label, description}) => ({id, label, description}))
  },
  { 
    group: "Support & Medical", 
    roles: ALL_ROLES.filter(r => r.roleCategoryId === 'cat_support').map(({roleId: id, label, description}) => ({id, label, description}))
  },
  { 
    group: "Officials & Ground Staff", 
    roles: ALL_ROLES.filter(r => r.roleCategoryId === 'cat_official').map(({roleId: id, label, description}) => ({id, label, description}))
  },
];
