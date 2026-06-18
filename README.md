# SmartDesk Support Router 🚀

An intelligent, end-to-end support ticket classification and routing platform. SmartDesk Router leverages Natural Language Processing (NLP) to parse employee requests, automatically categorize their priority, and route technical issues to the appropriate internal teams, complete with a closed-loop feedback mechanism for model corrections.

---

## 📸 Project Interface Walkthrough

### 1. Unified Dashboard (Clean State)
A clean, streamlined employee ticket entry form built with a premium Ocean Cyan theme.
![Dashboard Clean](./screenshots/dashboard_clean.png)

### 2. Real-Time NLP Classification Result
Once submitted, the query is analyzed in real time. The platform displays the predicted priority, assigns a routing team (or skips for awareness tickets), and presents options to accept or correct the output.
![Classification Result](./screenshots/classification_result.png)

### 3. Closed-Loop Correction Feedback Form
If the model's prediction is inaccurate, employees can submit corrected tags. The dropdown fields implement dynamic conditional validation so team selection is only required for technical routing paths.
![Correction Form](./screenshots/correction_form.png)

---

## ⚙️ System Architecture & Data Flow

### System Component Diagram
The diagram below details the components of the SmartDesk Router and how they interact:

```mermaid
graph TD
    subgraph Client [React Frontend - Port 3000]
        UI[Interactive UI App]
        Theme[Ocean Cyan Styles]
        Feed[Feedback Form]
    end

    subgraph Server [Flask API - Port 5000]
        API[runner.py Controller]
        P_Vec[Priority TF-IDF Vectorizer]
        P_Clf[Priority Logistic Regression Classifier]
        T_Vec[Team TF-IDF Vectorizer]
        T_Clf[Team Logistic Regression Classifier]
    end

    subgraph Database [Flat-File Storage]
        T_CSV[(sr_tickets.csv - Training Data)]
        S_CSV[(submissions.csv - Query Logs)]
        C_CSV[(corrections.csv - Feedback Logs)]
    end

    UI -->|POST /classify| API
    Feed -->|POST /correction| API
    
    API -->|Predict Priority| P_Clf
    API -->|Predict Team| T_Clf
    
    P_Clf -->|Read Binary| P_Vec
    T_Clf -->|Read Binary| T_Vec
    
    API -->|Write log| S_CSV
    API -->|Write correction| C_CSV
```

### Ticket Processing Sequence
Here is the request-response lifecycle for a support query classification and correction:

```mermaid
sequenceDiagram
    autonumber
    actor Employee
    participant UI as React Frontend
    participant API as Flask Backend
    participant ML as ML Engine (scikit-learn)
    participant CSV as CSV Logs

    Employee->>UI: Input query and click 'Classify SR'
    UI->>API: POST /classify { name, empId, query, file }
    API->>ML: Run text through Priority & Team Vectorizers
    ML-->>API: Return standardized predictions
    API->>CSV: Append transaction to submissions.csv
    API-->>UI: Respond with predictions (JSON)
    UI-->>Employee: Display Priority & Team routing output

    alt Classification is Incorrect
        Employee->>UI: Click 'Yes, Correct It' & select true values
        UI->>API: POST /correction { name, empId, query, correctedPriority, correctedTeam }
        API->>CSV: Append record to corrections.csv
        API-->>UI: Respond with 200 OK (Success)
        UI-->>Employee: Show confirmation toast
    end
```

---

## 📁 Repository Directory Structure

```text
SmartDesk-Support-Router/
├── classifiers/                    # Machine Learning Engine & Backend API
│   ├── runner.py                   # Flask API entry point and CLI prediction tool
│   ├── sr_classification.py        # ML Model training and evaluation script
│   └── text_utils.py               # Preprocessing utilities (stopwords, parsing)
├── data/                           # Data storage directory
│   ├── sr_tickets.csv              # Primary baseline training dataset
│   ├── submissions.csv             # Log of all incoming query classifications
│   └── corrections.csv             # Closed-loop user feedback correction log
├── diagrams/                       # High-level architecture visual assets
│   └── diagram.png
├── frontend/                       # Interactive web application
│   ├── src/
│   │   ├── App.js                  # Main React dashboard and form validation logic
│   │   ├── App.css                 # View layout, shadows, and glow animations
│   │   ├── index.js                # React bootstrapping index
│   │   └── index.css               # Core CSS variables (Ocean Cyan theme)
│   └── package.json
├── models/                         # Serialized ML model storage (generated during training)
│   ├── priority_classifier.joblib
│   ├── priority_vectorizer.joblib
│   ├── team_classifier.joblib
│   └── team_vectorizer.joblib
├── screenshots/                    # Dashboard walkthrough images
│   ├── dashboard_clean.png
│   ├── classification_result.png
│   └── correction_form.png
└── requirements.txt                # Python backend dependencies
```

---

## 🛠️ Installation & Getting Started

### Prerequisites
* **Python**: `3.8+`
* **Node.js**: `16.x+` (with `npm`)

### 1. Backend Server Setup
First, navigate to the root directory of the repository and set up a virtual environment:

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend Application Setup
Navigate to the frontend directory and install client packages:

```powershell
cd frontend
npm install
```

---

## 🚀 Execution & Usage

### 1. Training the Machine Learning Models
If you want to train the models from scratch or retrain them after merging feedback, run the training pipeline:

```powershell
cd classifiers
python sr_classification.py
```
This script reads `data/sr_tickets.csv`, normalizes the categories, filters missing labels, fits tf-idf vectorizers, trains Logistic Regression models, and saves the binary assets into the `models/` directory.

### 2. Running the Backend API
Start the Flask backend server on `http://127.0.0.1:5000`:

```powershell
cd classifiers
python runner.py api
```

### 3. Running the Frontend Web App
Start the React development server:

```powershell
cd frontend
npm start
```
This automatically compiles and opens the browser to `http://localhost:3000`.

---

## 🔄 The Closed-Loop Training Philosophy
As support requests are routed, employees submit corrections for misclassified tickets. These corrections are recorded in `data/corrections.csv`. To close the loop:
1. Merge the rows from `data/corrections.csv` back into the primary training dataset `data/sr_tickets.csv`.
2. Clean or drop duplicates.
3. Run `python sr_classification.py` to retrain and update your models.
4. Restart the API server to apply the updated classifier logic seamlessly.
