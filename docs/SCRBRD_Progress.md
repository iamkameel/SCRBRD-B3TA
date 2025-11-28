# SCRBRD Progress & Architecture Overview

This document provides a comprehensive breakdown of the SCRBRD application, detailing its features, architecture, and data structures as of the latest update.

---

## 1. Core Architecture

The application is a modern, full-stack web platform built on a robust and scalable technology stack.

-   **Frontend**:
    -   **Framework**: Next.js 14 with the App Router.
    -   **UI Library**: React 18 with Server Components.
    -   **Component Library**: ShadCN UI for accessible and reusable components.
    -   **Styling**: Tailwind CSS, with a custom theme defined in `src/app/globals.css`.
    -   **State Management**: Combination of React state, hooks, and SWR for data fetching.

-   **Backend & Database**:
    -   **Database**: Google Firestore is used as the primary NoSQL database for all application data.
    -   **Authentication**: Firebase Authentication handles user signup, login, and session management.
    -   **Security**: Firestore Security Rules (`firestore.rules`) are in place to control data access based on user roles.

-   **Generative AI**:
    -   **Framework**: Google's Genkit is used to define and orchestrate all AI-powered flows.
    -   **Models**: The platform leverages various Google AI models (Gemini family, Imagen) for tasks like text generation, data analysis, image creation, and technical analysis.
    -   **AI Flows**: All Genkit flows are defined in the `src/ai/flows/` directory.

-   **Hosting**: The application is configured for deployment on Firebase App Hosting.

---

## 2. Visual & Frontend Breakdown (UI/UX)

The user interface is designed to be intuitive, responsive, and role-aware, providing tailored experiences for different users.

### 2.1. Main Dashboards
-   **Role-Based Access**: Upon login, each user is directed to a dashboard specific to their active role (e.g., Admin, Coach, Player, Guardian).
-   **Key Components**: Dashboards contain relevant KPIs, links to common tasks, and summaries of upcoming events (e.g., fixtures, assignments).
-   **Key Files**: `src/app/dashboard/page.tsx`, `src/app/dashboards/`

### 2.2. Core Data Management Modules
-   **Pages**: Separate, feature-rich pages for `Schools`, `Divisions`, `Seasons`, `Fields`, `People`, `Teams`, and `Competitions`.
-   **Functionality**: These pages provide full Create, Read, Update, and Delete (CRUD) capabilities, complete with forms, dialogs, and data tables.
-   **Advanced UI**: Features powerful filtering, sorting, and multiple view modes (List, Card, Calendar) to manage large datasets effectively.
-   **Key Files**: `src/app/(schools|teams|people|...)`

### 2.3. Match & Scoring Engine
-   **Match Details**: A central page for each match showing lineups, weather, officials, AI analysis, and results.
-   **Live Scoring Interface**: A real-time, ball-by-ball scoring interface for Umpires and Scorers, featuring a dynamic wagon wheel for shot placement.
-   **Scorecard View**: A traditional, detailed scorecard is displayed for completed matches.
-   **Key Files**: `src/app/matches/[matchId]/`

### 2.4. Advanced Visualizations
-   **Match Analysis Charts**: Completed matches feature interactive charts:
    -   **Manhattan Chart**: Visualizes runs scored per over.
    -   **Worm Chart**: Compares the cumulative scores of the two teams throughout the match.
    -   **Wagon Wheel**: Shows the distribution and results of shots played.
-   **Player Performance Radar**: Located on the Player Tracker tab, this radar chart gives an at-a-glance summary of a player's coach-rated skills.
-   **Key Files**: `src/app/matches/[matchId]/match-charts.tsx`, `src/app/people/[personId]/tracker-charts.tsx`

### 2.5. Player Hub
-   **Player Profile**: A comprehensive view of a player, including their stats, team assignments, and personal details.
-   **Tracker Tab**: A new, dedicated tab that visualizes a player's long-term development through performance charts and logs for training, injuries, and milestones.
-   **Skills Tab**: Allows authorized coaches to rate a player's technical, mental, and physical attributes on a 1-20 scale.
-   **Key Files**: `src/app/people/[personId]/`

### 2.6. Administrative & Governance UI
-   **Data Management**: A centralized page for administrators to migrate sample data or delete data subsets.
-   **User Management**: An interface for Admins to view all users and manage their assigned roles.
-   **Strategic Calendar**: A high-level, multi-month calendar for Admins and Sportsmasters to plan fixtures and avoid scheduling conflicts.
-   **Rule Book & Role Directory**: Static reference pages for governance and clarity.
-   **Key Files**: `src/app/data-management/`, `src/app/user-management/`, `src/app/strategic-calendar/`

### 2.7. Public & Authentication Pages
-   **Landing Page (`/home`)**: A professional, public-facing page showcasing the app's features.
-   **Login & Signup**: Secure forms for user authentication, including role selection during signup.
-   **Key Files**: `src/app/home/`, `src/app/login/`, `src/app/signup/`

---

## 3. Backend & Data Model Breakdown

The backend logic is handled through Next.js Server Actions and Genkit AI flows, with data stored in Firestore.

### 3.1. Firestore Data Model
The database is structured around several key collections. The complete schema is defined in `src/lib/data.ts`.

-   **`people`**: Stores all users (players, coaches, admins, etc.). Document ID is the Firebase Auth UID.
-   **`schools`**, **`divisions`**, **`seasons`**: Foundational data for organizing competitions.
-   **`teams`**: Represents a team for a specific season/division. Contains a `roster` subcollection.
-   **`competitions`**: Defines leagues, cups, or tournaments.
-   **`matches`**: The core collection for all fixtures. Contains subcollections for `lineups`, `scorecards`, `officials`, and `transportAssignments`.
-   **`fields`**, **`vehicles`**: Manageable resources for logistics.
-   **`drills`**, **`sessions`**: For the training and session planner modules.
-   **`sponsors`**, **`financials`**, **`equipment`**: Collections for financial and equipment management.
-   **`assignmentRequests`**, **`familyLinks`**: Handle relationships and pending user assignments.

### 3.2. Server Actions (`/lib/actions/*.ts`)
All server-side logic and database interactions are encapsulated in Server Actions. This provides a secure and efficient way to handle data mutations directly from client components.

-   **`players.ts`, `teams.ts`, etc.**: Contain CRUD operations for their respective data models.
-   **`analysis.ts`**: The bridge between the UI and Genkit flows. It prepares data, calls the AI flows, and saves the results back to Firestore.
-   **`dashboard.ts`**: Fetches and aggregates data specifically for the role-based dashboards.
-   **`auth.ts`, `signup.ts`**: Handle user authentication and registration logic.

### 3.3. Genkit AI Flows (`/ai/flows/*.ts`)
These files define the core AI logic of the application.

-   **`generate-scorecard-flow.ts`**: Takes team lineups and generates a complete, realistic T20 scorecard.
-   **`generate-match-summary-flow.ts`**: Analyzes a scorecard to produce a journalistic match report.
-   **`generate-player-development-plan-flow.ts`**: Analyzes player stats and suggests training drills.
-   **`scout-player-flow.ts`**: Analyzes an uploaded image of a player to provide a technical scouting report.
-   **`get-match-forecast-flow.ts`**: Uses a Genkit Tool to provide a simulated weather forecast.
-   **`stats-query-flow.ts`**: A powerful flow that uses tools (`getCricketStats`, `getMatchStats`) to answer natural language questions about league and match statistics.
-   **Other Flows**: Numerous other flows exist for tasks like generating match previews, opposition analysis, player portraits, and more.
