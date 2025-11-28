# SCRBRD Server Actions: The Engine Room

This document provides a detailed breakdown of the files within the `src/lib/actions/` directory. This directory is the "engine room" of the SCRBRD application, containing all the backend logic executed on the server.

## What are Server Actions?

In Next.js, Server Actions are functions that are guaranteed to run only on the server. This is a modern, secure, and efficient way to handle tasks like database mutations (creating, updating, deleting data), processing payments, or interacting with third-party APIs without needing to create separate API endpoints.

Client components in the UI (e.g., a form in a dialog) can call these server-side functions directly, and Next.js handles all the complex networking behind the scenes. Every file in this directory is marked with the `'use server';` directive at the top, which tells Next.js to treat its exported functions as Server Actions.

---

## File Breakdown

Here is a summary of each file in the `src/lib/actions/` directory and its specific responsibilities.

### 1. `analysis.ts`

-   **Purpose**: This is the primary bridge between the user interface and the application's AI capabilities, which are defined in the `src/ai/flows/` directory.
-   **Key Functions**:
    -   It contains functions like `generateAndSaveScorecardAction`, `generateMatchReportAction`, and `generateMatchPreviewAction`.
    -   These functions typically perform the following steps:
        1.  Fetch the necessary data from Firestore (e.g., match details, team rosters).
        2.  Prepare this data into the specific format required by the AI flow.
        3.  Call the corresponding Genkit AI flow (e.g., `generateScorecard`, `generateMatchReport`).
        4.  Take the result from the AI and save it back into the appropriate Firestore document (e.g., updating a `match` document with the generated report).
        5.  Trigger a revalidation of the relevant UI path to show the new data to the user.

### 2. `data-management.ts`

-   **Purpose**: This file holds crucial administrative functions for managing the application's overall dataset. It's primarily used by administrators on the "Data Management" page.
-   **Key Functions**:
    -   `migrateSampleDataAction`: A powerful function that populates the entire Firestore database with a complete set of sample data, including schools, teams, players, completed matches, and scorecards. This is essential for demonstrating the app's features without manual data entry.
    -   `deleteAllDataAction`: A destructive action that clears all data from the database, allowing for a clean reset.
    -   `migrateSubsetAction` & `deleteSubsetAction`: Granular versions of the above, allowing an admin to migrate or delete only specific types of data (e.g., only schools, only fields).

### 3. `equipment.ts`

-   **Purpose**: Manages the complete lifecycle of team and player equipment.
-   **Key Functions**:
    -   `getEquipment`: Fetches the entire equipment inventory.
    -   `addEquipmentItemAction`, `updateEquipmentItemAction`, `deleteEquipmentItemAction`: Full CRUD operations for managing the inventory (e.g., adding a new bat, updating its status).
    -   `assignEquipmentAction`, `returnEquipmentAction`: Handles the check-out and check-in process, linking a specific item to a person and tracking its availability.

### 4. `financials.ts`

-   **Purpose**: Manages the financial records for the league or organization.
-   **Key Functions**:
    -   `getTransactions`: Retrieves a list of all financial transactions.
    -   `addTransactionAction`, `updateTransactionAction`, `deleteTransactionAction`: Full CRUD operations for recording income (e.g., from sponsorships) and expenses (e.g., for venue hire).

### 5. `sponsors.ts`

-   **Purpose**: Manages the list of sponsors for the league or specific competitions.
-   **Key Functions**:
    -   `getSponsors`: Fetches a list of all sponsors.
    -   `addSponsorAction`, `updateSponsorAction`, `deleteSponsorAction`: Full CRUD operations for managing sponsor information, such as their name, logo, and website. This data can then be linked to competitions.
