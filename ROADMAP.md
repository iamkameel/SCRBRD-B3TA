# Roadmap: Towards a Fully Functional Platform

This document outlines the key features and enhancements required to transition SCRBRD from its current feature-rich state to a fully functional, production-ready application.

---

### Category 1: Core Functionality & User Experience

-   [ ] **Comprehensive User Onboarding**: Implement a guided setup wizard for new users upon first login. This should prompt them to complete their profile, request team assignments, and familiarize them with their role-specific dashboard.
-   [ ] **Team & Competition Dashboards**: Create dedicated, shareable dashboard pages for individual teams and competitions, showing their specific roster, schedule, stats, and standings.
-   [ ] **Player Availability Management**: Build a central interface for Team Managers and Coaches to view player availability for upcoming matches at a glance, with tools to send reminders to players who haven't responded.
-   [ ] **Notification System Overhaul**:
    -   Implement a robust notification system for key events (e.g., new match scheduled, lineup confirmed, result posted).
    -   Provide users with granular control over which email and push notifications they receive in their settings.
-   [ ] **Mobile-First Live Scoring**: Refine the live scoring interface to be optimized for mobile devices, ensuring umpires and scorers can easily use it on the field with a phone or tablet.

### Category 2: Administration & Governance

-   [ ] **Granular Role-Based Access Control (RBAC)**: Move beyond role-based dashboards to implement true RBAC at the data level. This will ensure, for example, that a coach can only edit the lineup for their own team, and a school admin can only manage their own school's data.
-   [ ] **Financials & Sponsorship Integration**:
    -   Link sponsors directly to teams or competitions.
    -   Allow financial transactions to be categorized against specific teams, matches, or competitions for detailed financial reporting.
-   [ ] **Audit Logging**: Create a system to log key administrative actions (e.g., user role changes, data deletion, match rescheduling) to provide a clear audit trail.
-   [ ] **Data Import/Export**: Build tools for administrators to bulk-import player rosters or export competition data (standings, stats) in CSV format.

### Category 3: Advanced AI & Analytics

-   [ ] **AI-Powered Training Recommendations**: Enhance the Player Development Plan by having the AI suggest specific drills from the Drill Library based on a player's identified weaknesses.
-   [ ] **Team Strength & Weakness Analysis**: Create an AI flow that analyzes a team's overall statistics to generate a summary of their collective strengths (e.g., "Strong top-order batting") and weaknesses (e.g., "Vulnerable to spin bowling").
-   [ ] **Natural Language Query on Match Data**: Extend the stats query tool to answer questions about specific matches, e.g., "How many boundaries were hit in the final 5 overs of the second innings?"
-   [ ] **Automated Highlight Clipping**: For users who upload match video, use AI to identify key moments (wickets, boundaries) and automatically clip them into a shareable highlight reel.

---

Completing these items will result in a polished, secure, and highly intelligent cricket management platform ready for real-world use.