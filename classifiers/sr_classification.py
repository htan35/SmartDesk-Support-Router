import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report
from joblib import dump

# Load CSV
df = pd.read_csv("../data/sr_tickets.csv")

# Clean whitespaces and normalize labels
df["priority"] = df["priority"].str.strip().str.upper()
df["team"] = df["team"].str.strip()

# Extract input and labels
X = df["sr_data_query"]
y_priority = df["priority"]

# Filter out awareness and any missing team values for team training
df_team = df[df["priority"] != "AWARENESS"].dropna(subset=["team"])
X_team = df_team["sr_data_query"]
y_team = df_team["team"]

# Train/test split for priority
X_train, X_test, y_priority_train, y_priority_test = train_test_split(X, y_priority, test_size=0.2, random_state=42)

# Priority classifier
priority_model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression(max_iter=1000))
])

# Train priority model
priority_model.fit(X_train, y_priority_train)

# Evaluate priority model
print("=== Priority Classification Report ===")
print(classification_report(y_priority_test, priority_model.predict(X_test)))

# Save priority model
dump(priority_model, "../models/priority_classifier.joblib")

# Team classifier (only for technical queries)
team_model = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("clf", LogisticRegression(max_iter=1000))
])

# Train and save team model
team_model.fit(X_team, y_team)
dump(team_model, "../models/team_classifier.joblib")

print("\nModels saved successfully.")
