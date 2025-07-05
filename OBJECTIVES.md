# Project Objectives: SCRBRD

This document outlines the major features and refinements implemented in this application.

## 1. Core Data Management

-   **Schools, Divisions, Seasons, Fields**: Full CRUD (Create, Read, Update, Delete) management modules for foundational data entities.
-   **People Module**: A comprehensive system to manage all personnel (players, coaches, staff).
    -   Detailed person profiles.
    -   Automated player statistics calculation.
    -   Family Links system to connect guardians and children.
-   **Teams Module**:
    -   Team creation and management, linked to schools, divisions, and seasons.
    -   Roster management to assign people to teams with specific roles.
    -   Team-specific dashboards showing stats and match schedules.
-   **Competitions Dashboard**: A centralized hub to create and administer leagues, cups, series, and tournaments.
-   **User Profile Management**: A settings page where the current user can view and update their personal information.

## 2. Match & Scoring Engine

-   **Full Match Lifecycle**: Create new fixtures, manage lineups, and view detailed results.
-   **AI Scorecard Generation**: An intelligent feature to generate a complete, realistic scorecard for a fictional T20 match based on team lineups. This populates the match with plausible data for demonstration and testing.

## 3. AI-Powered Analysis & Insights

-   **AI Match Summaries**: The AI can generate concise, journalistic summaries of completed matches using the scorecard data. These summaries are available for download.
-   **AI Match Previews**: For scheduled matches, the AI analyzes team stats, key players, and weather to produce an analytical preview.
-   **AI Player of the Match Selection**: After a match is completed, the AI analyzes the scorecard to determine the most valuable player and provides a justification for its choice.
-   **AI Weather Forecasts**: Utilizes a Genkit Tool to fetch and display a relevant weather forecast for the match day and location.

## 4. Logistics & Transport

-   **Transport Module**: A dedicated section to manage a fleet of vehicles.
-   **Driver Roster**: A tab to display all personnel with the "Driver" role.
-   **Logistics Hub**: Functionality to assign vehicles and drivers to specific matches, with a centralized "Assignments" view to track all transport logistics.

## 5. Advanced User Interface & User Experience

-   **Modern UI/UX**: A clean, responsive interface built with Next.js, React, ShadCN UI, and Tailwind CSS.
-   **Visual Dashboard**: The main dashboard features charts to visualize team standings and top player leaderboards, offering an at-a-glance overview of the league.
-   **Advanced Navigation**:
    -   Powerful filtering and searching capabilities on key pages (Matches, Teams, People).
    -   Multiple view modes on the Matches page, including List, Card, and an interactive Calendar view.
-   **Flexible Data Management**: The Data Management page was enhanced to allow for granular control, enabling migration or deletion of individual data subsets (e.g., only schools, only people).
-   **Refined UI**:
    -   Navigation and terminology were clarified (e.g., "Players" to "People") for better intuition.
    -   Placeholder pages were fleshed out with sample data to demonstrate intended functionality.
    -   A unique color theme was applied to give the app a distinct visual identity.

## 6. Advanced Analytics, UI, and Governance (The Next Innings)

-   **Advanced Match Visualizations**: The match details page for completed games now includes dynamic, interactive charts: a Manhattan chart (runs per over), a Worm chart (cumulative score), and a Wagon Wheel summary to visually narrate the match.
-   **Player Performance Tracker**: A new "Tracker" tab on player profiles provides a central hub for visualizing long-term development, including performance charts, training logs, injury records, and milestones.
-   **Player Skills Management**: A "Skills" tab on the player profile allows authorized coaches to rate player abilities (e.g., power, timing, accuracy) on a numeric scale, with a radar chart for at-a-glance summaries.
-   **Public-Facing Home Page**: A professional landing page at `/home` showcases the app's features to prospective users.
-   **Awards Hub**: A new "Awards" page serves as a "Trophy Cabinet" for competition winners and highlights the season's top run-scorers and wicket-takers.
-   **Digital Rule Book**: A searchable "Rule Book" page provides an easy reference for the key laws of cricket.
-   **User Role Directory**: A "User Roles" page clearly defines the responsibilities and permissions for each role in the system.
-   **Strategic Calendar**: A multi-month, filterable calendar for Admins and Sportsmasters provides a high-level view of all fixtures, helping to identify scheduling conflicts and plan resources.
