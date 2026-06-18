from joblib import load
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import csv
from werkzeug.utils import secure_filename

# Load trained models
priority_model = load("../models/priority_classifier.joblib")
team_model = load("../models/team_classifier.joblib")

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
CSV_FILE = '../data/submissions.csv'
CORRECTIONS_FILE = '../data/corrections.csv'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def classify_sr(query):
    raw_priority = priority_model.predict([query])[0]
    priority = raw_priority.strip().upper()
    result = {
        "query": query,
        "priority": priority,
        "team": None
    }

    # Only assign team if not awareness
    if priority != "AWARENESS":
        raw_team = team_model.predict([query])[0]
        result["team"] = raw_team.strip()

    return result

@app.route('/classify', methods=['POST'])
def classify():
    # Accept form data and files
    name = request.form.get('name', '')
    employee_id = request.form.get('employeeId', '')
    query = request.form.get('query', '')
    files = request.files.getlist('files')
    result = classify_sr(query)

    # Save files and collect filenames
    saved_files = []
    for file in files:
        if file and file.filename:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            saved_files.append(filename)

    # Append to CSV
    row = [name, employee_id, query, result['priority'], result.get('team') or '', ';'.join(saved_files)]
    file_exists = os.path.isfile(CSV_FILE)
    with open(CSV_FILE, 'a', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow(['Name', 'Employee ID', 'Query', 'Priority', 'Team', 'Files'])
        writer.writerow(row)

    return jsonify(result)

@app.route('/correction', methods=['POST'])
def correction():
    data = request.get_json()
    # Extract all relevant fields
    name = data.get('name', '')
    employee_id = data.get('employeeId', '')
    query = data.get('query', '')
    predicted_priority = data.get('predictedPriority', '')
    predicted_team = data.get('predictedTeam', '')
    corrected_priority = data.get('correctedPriority', '')
    corrected_team = data.get('correctedTeam', '')
    # Append to corrections.csv
    file_exists = os.path.isfile(CORRECTIONS_FILE)
    with open(CORRECTIONS_FILE, 'a', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow(['Name', 'Employee ID', 'Query', 'Predicted Priority', 'Predicted Team', 'Corrected Priority', 'Corrected Team'])
        writer.writerow([name, employee_id, query, predicted_priority, predicted_team, corrected_priority, corrected_team])
    return jsonify({'status': 'success'})

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'api':
        app.run(debug=True)
    else:
        sr = input("Please enter the service request query: ")
        response = classify_sr(sr)
        print("Query:", response["query"])
        
        print("Predicted Priority:", response["priority"])
        
        if response["priority"] != "AWARENESS":
            print("Assigned Team:", response["team"])
        else:
            print("Team assignment skipped (awareness query)")
