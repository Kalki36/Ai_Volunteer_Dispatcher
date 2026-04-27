import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Users, MapPin, Calendar, CheckCircle } from 'lucide-react';

export default function Registration() {
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    availability: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const skillArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/volunteers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          skills: skillArray,
          availability: formData.availability,
          location: formData.location
        })
      });
      
      if (!response.ok) throw new Error('Failed to register volunteer');

      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', skills: '', availability: '', location: '' });
      
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Error registering: ' + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden glass-panel">
        <div className="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-3xl font-extrabold text-white flex items-center">
            <Users className="w-8 h-8 mr-3" />
            Volunteer Registration
          </h2>
          <p className="text-indigo-100 mt-2">Join our network and help make an impact during emergencies and events.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Successfully registered! Thank you for volunteering.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
            <input 
              type="text" required
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              placeholder="e.g. First Aid, Translation, Driving, Cooking"
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.skills.split(',').filter(s=>s.trim()).map((s,i) => (
                <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                  {s.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-gray-400" /> Availability
              </label>
              <select 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow bg-white"
                value={formData.availability}
                onChange={e => setFormData({...formData, availability: e.target.value})}
              >
                <option value="">Select...</option>
                <option value="Weekdays">Weekdays</option>
                <option value="Weekends">Weekends</option>
                <option value="Evenings">Evenings</option>
                <option value="Anytime">Anytime (Emergency Backup)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-gray-400" /> Location
              </label>
              <input 
                type="text" required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                placeholder="e.g. New York, NY"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-200 transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register as Volunteer'}
          </button>
        </form>
      </div>
    </div>
  );
}
