# SCRBRD Application Build: Folder Structure Explained

This document provides a comprehensive overview of the `src/app` directory, detailing the purpose of each folder and how it contributes to the overall functionality of the SCRBRD application. The structure is based on the Next.js App Router, where each folder typically represents a route segment in the URL.

---

## 1. Core Application & User Experience

These folders represent the primary user-facing pages and core functionalities.

-   **`/dashboard`**: The main entry point after a user logs in. This page acts as a router, dynamically loading the appropriate dashboard component from the `/dashboards` directory based on the user's active role.

-   **`/dashboards`**: Contains the specific UI components for each role-based dashboard (e.g., `admin-dashboard.tsx`, `coach-dashboard.tsx`). This modular approach keeps each role's landing page organized and separate.

-   **`/home`**: The public-facing landing page for the application. This is what users see before they log in, showcasing the app's features.

-   **`/login` & `/signup`**: Handle user authentication. These are public routes for users to sign in or create a new account.

-   **`/settings`**: The user's personal settings page, where they can update their profile information, change notification preferences, and manage their theme.

---

## 2. Data Management & CRUD Modules

These folders correspond to the main data entities in the application, providing full Create, Read, Update, and Delete (CRUD) functionality.

-   **`/people`**: Manages all users in the system (players, coaches, staff). The `[personId]` sub-folder is a dynamic route that displays the detailed profile page for a specific person.

-   **`/teams`**: Manages all teams. The `[teamId]` sub-folder displays the detailed dashboard for a specific team, including its roster, schedule, and stats.

-   **`/schools`**: Manages the list of schools or clubs. The `[schoolId]` sub-folder shows a detailed profile for a specific school.

-   **`/competitions`**: The central hub for managing leagues, cups, and tournaments. The `[competitionId]` sub-folder is the detailed dashboard for a single competition, showing standings or brackets.

-   **`/matches`**: The core of the on-field action. This directory contains the list view for all matches. The `[matchId]` sub-folder is the heart of the scoring engine, containing the live scoring interface, detailed scorecards, and AI analysis for a specific match.

-   **`/seasons` & `/divisions`**: Foundational data management for organizing the league structure.

-   **`/fields`**: Manages all playing venues. The `[fieldId]` sub-folder provides details about a specific field, including its condition and upcoming schedule.

---

## 3. Specialized Features & Modules

These folders contain the UI for specific, feature-rich sections of the application.

-   **`/analysis`**: The "Analysis Hub" where users can perform natural language queries on league stats and generate AI-powered scouting reports on teams.

-   **`/awards`**: The "Trophy Cabinet" of the application, showcasing competition winners and individual top performers for the season.

-   **`/planner`**: A dedicated training session planner for coaches. The `[sessionId]` sub-folder allows for the detailed construction of a single training session by adding drills from the library.

-   **`/drills`**: The "Drill Library," where coaches can view and create reusable training drills.

-   **`/scouting`**: The "AI Scouting Assistant" page, where users can upload a photo of a player to get a technical analysis of their batting or bowling form.

-   **`/umpire-review`**: The "Third Umpire" feature, allowing users to upload media of a close call (like an LBW appeal) and receive a simulated DRS-style decision from the AI.

-   **`/transport`**: The logistics hub for managing the fleet of vehicles and assigning them to matches.

-   **`/equipment`**: Manages the inventory of team equipment (bats, pads, etc.) and tracks assignments to players.

-   **`/financials` & `/billing`**: Modules for managing the league's finances, including tracking income/expenses and issuing invoices.

-   **`/sponsors`**: A module for managing league and team sponsors.

-   **`/strategic-calendar`**: A high-level, multi-month calendar view designed for administrators to visualize all fixtures and plan resources effectively.

---

## 4. Governance & Administration

These folders are primarily for administrative and informational purposes.

-   **`/user-management`**: An admin-only page for viewing all users in the system and managing their roles and permissions.

-   **`/audit-log`**: An admin-only page that displays a chronological record of key actions taken within the system for accountability.

-   **`/data-management`**: An admin-only page for populating the database with sample data or deleting existing data sets, crucial for testing and demonstration.

-   **`/roles`**: A public reference page that defines the responsibilities and permissions for each user role in the system.

-   **`/rulebook`**: A digital, searchable reference for the key laws of cricket.

-   **`/features`**: A page detailing all of the application's capabilities.

-   **`/help`**: A simple onboarding and FAQ page to guide new users.

-   **`/pitch-deck`**: A presentation-style page summarizing the app's value proposition.

---

## 5. System & Configuration

-   **`/__tests__`**: Contains Jest and React Testing Library tests for ensuring component reliability.

-   **`/firebase-messaging-sw`**: A special route that serves the service worker file required for Firebase Cloud Messaging (Push Notifications).

-   **`/manifest.webmanifest`**: Defines the metadata for the Progressive Web App (PWA), allowing users to "install" the app to their home screen.
