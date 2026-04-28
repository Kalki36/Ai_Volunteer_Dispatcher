import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin (Using a stub if no credentials are provided to avoid crashing)
let db = null;
try {
  const accountPathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  
  const serviceAccountPath = accountPathEnv && accountPathEnv.startsWith('/') 
    ? path.join(__dirname, accountPathEnv)
    : path.resolve(__dirname, accountPathEnv || 'serviceAccountKey.json');
    
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized from JSON environment variable.");
  } else if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized successfully from file.");
  } else {
    // We will still initialize it with default config if application default credentials exist
    admin.initializeApp();
    console.log("Firebase Admin Initialized using default credentials.");
  }
  db = admin.firestore();
} catch (error) {
  console.log("Firebase Admin initialization skipped or failed:", error.message);
  console.log("Backend will operate with mocked queries if DB is unavailable.");
}

// Volunteer CRUD APIs
app.get('/api/volunteers', async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snapshot = await db.collection('volunteers').get();
    const volunteers = [];
    snapshot.forEach(doc => {
      volunteers.push({ id: doc.id, ...doc.data() });
    });
    res.json(volunteers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/volunteers', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const newVol = req.body;
    const docRef = await db.collection('volunteers').add({
      ...newVol,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: docRef.id, ...newVol });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/volunteers/:id', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const { id } = req.params;
    await db.collection('volunteers').doc(id).delete();
    res.status(200).json({ success: true, message: "Volunteer deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task CRUD APIs
app.get('/api/tasks', async (req, res) => {
  try {
    if (!db) return res.json([]);
    const snapshot = await db.collection('tasks').orderBy('createdAt', 'desc').get();
    const tasks = [];
    snapshot.forEach(doc => {
      tasks.push({ id: doc.id, ...doc.data() });
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const newTask = req.body;
    const docRef = await db.collection('tasks').add({
      ...newTask,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.status(201).json({ id: docRef.id, ...newTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Volunteer Dispatcher Backend is running.' });
});

/**
 * Root endpoint to prevent 404 on base URL
 */
app.get('/', (req, res) => {
  res.send('AI Volunteer Dispatcher Backend is successfully deployed and running!');
});

/**
 * Matches volunteers to a specific task using Gemini AI
 * Expects { taskId, taskDescription, volunteers: [{id, name, skills, availability}] }
 */
app.post('/api/match-volunteers', async (req, res) => {
  try {
    const { taskDescription, volunteers } = req.body;
    
    if (!taskDescription || !volunteers || !Array.isArray(volunteers)) {
      return res.status(400).json({ error: 'Missing taskDescription or volunteer array in body' });
    }

    const volunteerListStr = volunteers.map(v => 
      `ID: ${v.id}, Name: ${v.name || 'Unknown'}, Skills: ${Array.isArray(v.skills) ? v.skills.join(', ') : (v.skills || 'None')}, Availability: ${v.availability || 'Unknown'}, Location: ${v.location || 'Unknown'}`
    ).join('\n');

    const prompt = `Given the following NGO task and list of volunteers, match the best volunteers.

Task:
${taskDescription}

Volunteers:
${volunteerListStr}

Return:
1. Top 3 best matches
2. Matching score (0-100)
3. Clear explanation for each match
4. Priority level (Low, Medium, High, Critical)

Output format exactly in JSON:
{
  "matches": [
    {
      "name": "",
      "score": "",
      "reason": ""
    }
  ],
  "priority": "",
  "explanation": ""
}`;

    let outputText = '';
    try {
      let response;
      try {
        // Call Gemini 2.5 Flash
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
      } catch (apiError) {
        console.warn("Gemini 2.5 Flash failed (possibly high demand), falling back to 1.5 Flash...", apiError.message);
        // Fallback to Gemini 1.5 Flash
        response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
      }
      outputText = response.text;
    } catch (finalApiError) {
      console.warn("All AI models failed (likely quota or availability). Using local fallback logic.", finalApiError.message);
      
      // Create a mocked fallback response
      // Calculate a basic score based on text matching between taskDescription and volunteer skills
      const taskDescLower = (taskDescription || "").toLowerCase();
      
      const scoredVolunteers = volunteers.map(v => {
        let matchScore = 50; // Base score for availability
        const skills = Array.isArray(v.skills) ? v.skills : (typeof v.skills === 'string' ? v.skills.split(',').map(s=>s.trim()) : []);
        
        let matchedSkills = 0;
        if (skills.length > 0) {
          skills.forEach(skill => {
            if (skill && taskDescLower.includes(skill.toLowerCase())) {
              matchedSkills++;
              matchScore += 25; // Add 25% for each matched skill
            }
          });
        }
        
        // Cap score at 98% for fallback
        matchScore = Math.min(98, matchScore);
        
        return {
          ...v,
          calculatedScore: matchScore,
          matchedSkillCount: matchedSkills
        };
      });

      // Sort by highest score first
      scoredVolunteers.sort((a, b) => b.calculatedScore - a.calculatedScore);
      const selectedVolunteers = scoredVolunteers.slice(0, Math.min(3, scoredVolunteers.length));
      
      const fallbackResult = {
        matches: selectedVolunteers.map(v => ({
          name: v.name || "Unknown",
          score: v.calculatedScore,
          reason: v.matchedSkillCount > 0 
            ? `Matched ${v.matchedSkillCount} skill(s) found in task description (Automated Fallback Mode).`
            : `Matched based on general availability (Automated Fallback Mode).`
        })),
        priority: "Unassessed",
        explanation: "The AI service is currently experiencing high demand or quota limits. This is a local fallback match using available volunteers based on basic keyword matching."
      };
      
      return res.json(fallbackResult);
    }

    // Process real AI output if successful
    const outputTextToParse = outputText;
    
    try {
      const matchData = JSON.parse(outputText);
      res.json(matchData);
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", parseError, "Raw Output:", outputText);
      res.status(500).json({ error: 'Failed to parse AI output', raw: outputText });
    }
  } catch (error) {
    console.error("Match API Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Export the Express API
export default app;
