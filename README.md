# AI Volunteer Dispatcher

An intelligent NGO task scheduling and volunteer dispatch application powered by Google Gemini API, React, and Node.js. 

This platform empowers NGOs to match volunteers to critical tasks based on their skills, availability, and location, prioritizing emergency interventions automatically through AI context analysis.

## Features Built
- **Explainable AI Matching**: Uses Gemini to suggest the best volunteer options for a task and outputs reasons and score.
- **Auto Priority Scoring**: Gemini assesses the NLP description of what's happening to categorize tasks into Critical, High, Medium, or Low urgency.
- **Voice-to-Text Input**: NGOs can simply hit "Speak Task" in the task posting screen to dictate details naturally.
- **Responsive Dashboard UI**: Real-time display of statistics and dynamically matched tasks with a modern glass-panel aesthetic.

## Architecture
- **Frontend**: React (Vite) + Tailwind CSS + Lucide React + Web Speech API
- **Backend**: Node.js + Express + `@google/genai`
- **Database**: Firebase Firestore (Ready to connect)

## Setup Instructions

### 1. Backend Setup
1. Open terminal and navigate:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Open `backend/.env` and update your Gemini API key:
   ```env
   GEMINI_API_KEY="AIzaSy...your-gemini-key"
   ```
   *(Optional)* If you have a Firebase Admin Service Account JSON, add its path to `FIREBASE_SERVICE_ACCOUNT_PATH`.
4. Run the server:
   ```bash
   node index.js
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add your Firebase config to `frontend/src/firebase.js` if you wish to persist registration / tasks to the actual remote Firestore db.
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Demo
Once both servers are running:
1. Go to `https://volunteer-dispatcher-frontend.vercel.app/`.
2. Navigate to **Post Task**.
3. Use the **Speak Task** button or type in task requirements.
4. Click **Find Best Volunteers with AI**.
5. See the matching scores, explanations, and dynamic priorities returned from the Gemini API running on the Node.js backend.
