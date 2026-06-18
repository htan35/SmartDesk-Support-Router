# SmartDesk Support Router: Project Explanation

Welcome to the SmartDesk Support Router project! This document serves as a comprehensive guide for new developers and stakeholders to understand how the system is architected, how data flows through it, and how to get started.

## System Architecture

The project follows a classic client-server architecture with an integrated Machine Learning pipeline.

```mermaid
graph TD
    subgraph Client [Frontend - React]
        UI[User Interface]
        Form[Input Form]
        Results[Results & Feedback UI]
    end

    subgraph Server [Backend - Flask]
        API[REST API /classify]
        CorrectionAPI[REST API /correction]
        ModelLoader[Model Inference Engine]
    end

    subgraph ML_Models [Machine Learning Models - Scikit-learn]
        PriorityModel[Priority Classifier Model]
        TeamModel[Team Classifier Model]
    end

    subgraph Storage [Local Data Storage]
        SubmissionsCSV[(submissions.csv)]
        CorrectionsCSV[(corrections.csv)]
        UploadsDir[uploads/ Directory]
    end

    %% Flow
    UI -->|1. User Input| Form
    Form -->|2. HTTP POST JSON/FormData| API
    
    API -->|3. Query Text| ModelLoader
    ModelLoader -->|4. Predict| PriorityModel
    ModelLoader -->|5. Predict if not Awareness| TeamModel
    
    PriorityModel -.->|Priority Result| ModelLoader
    TeamModel -.->|Team Result| ModelLoader
    
    ModelLoader -->|6. Save Data| SubmissionsCSV
    API -->|7. Save Files| UploadsDir
    ModelLoader -->|8. JSON Response| Results
    
    Results -->|9. User Feedback - Optional| CorrectionAPI
    CorrectionAPI -->|10. Save Correction| CorrectionsCSV
```

### Component Breakdown

1.  **Frontend (React)**: Built with Create React App. It provides a clean, modern interface where employees can submit SR data (text queries and supporting files). It handles state management (form inputs, loading states) and communicates asynchronously with the Flask backend.
2.  **Backend (Flask)**: A lightweight Python web server. It exposes endpoints (`/classify` and `/correction`) to receive data from the frontend.
3.  **Machine Learning Models**: 
    *   Trained using `scikit-learn`'s `TfidfVectorizer` and `LogisticRegression`.
    *   **Priority Classifier**: Determines if an SR is 'HIGH PRIORITY URGENT TECHNICAL', 'AWARENESS', etc.
    *   **Team Classifier**: Assigns a specific team (e.g., 'TECH', 'PRODUCT') *unless* the priority is purely informational ('AWARENESS').
    *   Models are serialized and loaded via `joblib`.
4.  **Data Storage**: Simple local file-based storage using CSV files for logging submissions and corrections, acting as a lightweight database suitable for initial deployment or internal projects.

---

## Activity Flow

The following diagram illustrates the step-by-step process of handling a single Service Request.

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant ML_Pipeline
    participant Storage

    User->>Frontend: Fills Name, Emp ID, Query, Files
    User->>Frontend: Clicks "Classify"
    Frontend->>Backend: POST /classify - FormData
    Backend->>Storage: Saves uploaded files to /uploads
    
    Backend->>ML_Pipeline: Sends Query String
    ML_Pipeline->>ML_Pipeline: Predict Priority
    
    alt Priority != "AWARENESS"
        ML_Pipeline->>ML_Pipeline: Predict Team
    else
        ML_Pipeline->>ML_Pipeline: Skip Team Prediction
    end
    
    ML_Pipeline-->>Backend: Returns predictions
    Backend->>Storage: Appends record to submissions.csv
    Backend-->>Frontend: Returns JSON result
    
    Frontend-->>User: Displays Predicted Priority & Team
    
    User->>Frontend: Checks if result is correct
    alt Result is Incorrect
        User->>Frontend: Clicks Yes - Discrepancy
        Frontend-->>User: Shows Correction Form
        User->>Frontend: Selects Correct Priority & Team
        User->>Frontend: Submits Correction
        Frontend->>Backend: POST /correction - JSON
        Backend->>Storage: Appends to corrections.csv
        Backend-->>Frontend: Success Response
        Frontend-->>User: Shows "Thank you" alert
    else Result is Correct
        User->>Frontend: Clicks "No"
    end
```

## How to Work on This Project

### 1. Prerequisites
*   **Node.js & npm**: For running the React frontend.
*   **Python 3.x**: For running the Flask backend and ML models.

### 2. Running Locally
*   **Backend**: Navigate to the `classifiers` directory and run `python runner.py api`. This starts the server on port 5000.
*   **Frontend**: Navigate to the `frontend` directory and run `npm start`. This starts the React dev server on port 3000.

### 3. Training New Models
If the underlying dataset (`data/sr_tickets.csv`) changes, you need to retrain the models:
1.  Navigate to the `classifiers` directory.
2.  Run `python sr_classification.py`.
3.  This script will process the data, train new pipelines, print evaluation metrics, and save new `.joblib` files to the `models/` directory. The backend automatically loads these upon next startup.

## Developer Philosophy

This project aims to be **Simple, Robust, and Intuitive**.
*   **Modularity**: Keep the frontend UI logic separated from the backend ML logic.
*   **Feedback Loop**: The correction mechanism is crucial. Over time, `corrections.csv` can be merged back into `sr_tickets.csv` to retrain and improve the model accuracy.
