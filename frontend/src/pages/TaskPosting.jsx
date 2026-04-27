import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Send, ShieldAlert, Sparkles, Loader2 } from 'lucide-react';

export default function TaskPosting() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    skills_required: '',
    urgency: 'Medium'
  });
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setFormData(prev => ({
          ...prev,
          description: prev.description + (prev.description ? ' ' : '') + finalTranscript
        }));
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMatchResult(null);

    try {
      let activeVolunteers = [];
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const volRes = await fetch(`${API_BASE}/api/volunteers`);
        activeVolunteers = await volRes.json();
      } catch (e) {
        console.error("Could not fetch real volunteers, using mock:", e);
      }
      
      // Fallback if db is empty - user wants no predefined resources
      if (!activeVolunteers || activeVolunteers.length === 0) {
        alert("No active volunteers found in the database. Please register some volunteers first.");
        setIsProcessing(false);
        return;
      }

      // Create comprehensive task description for AI
      const fullTaskDesc = `Title: ${formData.title}\nLocation: ${formData.location}\nUrgency: ${formData.urgency}\nRequired Skills: ${formData.skills_required}\nDetails: ${formData.description}`;
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.post(`${API_BASE}/api/match-volunteers`, {
        taskDescription: fullTaskDesc,
        volunteers: activeVolunteers
      });

      setMatchResult(response.data);
      
      try {
        await axios.post(`${API_BASE}/api/tasks`, {
          title: formData.title,
          description: formData.description,
          location: formData.location,
          skills_required: formData.skills_required,
          urgency: formData.urgency,
          priority: response.data.priority,
          matches: response.data.matches,
          time: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to save task to database:", err);
      }
    } catch (error) {
      console.error('Error fetching AI match:', error);
      alert('Failed to process task with AI. Ensure backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
      {/* Task Posting Form */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden glass-panel">
        <div className="px-8 py-6 bg-gradient-to-r from-red-500 to-orange-500">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <ShieldAlert className="w-6 h-6 mr-3" />
            Post NGO Task
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title</label>
            <input 
              required type="text"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
              placeholder="e.g. Emergency Medical Supply Delivery"
              value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Description (Type or Speak)</label>
              <button 
                type="button" 
                onClick={toggleListening}
                className={`p-2 rounded-full transition-colors flex items-center text-xs font-medium ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {isListening ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
                {isListening ? 'Stop Listening' : 'Speak Task'}
              </button>
            </div>
            <textarea 
              required rows="4"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
              placeholder="Describe the task details..."
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
              <input 
                type="text" required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                placeholder="e.g. First Aid, Driving"
                value={formData.skills_required} onChange={e => setFormData({...formData, skills_required: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input 
                type="text" required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500"
                placeholder="e.g. Downtown Shelter"
                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full flex justify-center items-center bg-gray-900 text-white font-bold py-4 px-4 rounded-xl hover:bg-gray-800 transition-all transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />}
            {isProcessing ? 'AI Processing Match...' : 'Find Best Volunteers with AI'}
          </button>
        </form>
      </div>

      {/* AI Results Panel */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden glass-panel p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Sparkles className="w-6 h-6 mr-2 text-purple-600" />
          AI Matching Engine Results
        </h3>

        {!matchResult && !isProcessing && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            <Mic className="w-12 h-12 mb-3 text-gray-300" />
            <p>Post a task to see AI recommendations</p>
          </div>
        )}

        {isProcessing && (
          <div className="h-64 flex flex-col items-center justify-center text-indigo-600">
            <Loader2 className="w-12 h-12 mb-4 animate-spin text-indigo-500" />
            <p className="font-medium animate-pulse">Analyzing semantics and matching skills...</p>
          </div>
        )}

        {matchResult && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
              <span className="font-semibold text-gray-700">System Priority:</span>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                matchResult.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                matchResult.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {matchResult.priority.toUpperCase()}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
              <strong>AI Analysis:</strong> {matchResult.explanation}
            </p>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-800">Assigned Volunteers (Top {matchResult.matches?.length || 0})</h4>
              {matchResult.matches?.map((match, idx) => (
                <div key={idx} className="bg-white border hover:border-indigo-300 transition-colors rounded-xl p-4 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg text-indigo-900">{match.name}</span>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded">Score: {match.score}%</span>
                  </div>
                  <p className="text-sm text-gray-600">{match.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
