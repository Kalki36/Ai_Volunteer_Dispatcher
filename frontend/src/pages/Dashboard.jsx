import React, { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Users, Clock, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [volunteers, setVolunteers] = useState([]);
  const [ongoingTasks, setOngoingTasks] = useState([]);
  const [allocatingVolunteer, setAllocatingVolunteer] = useState(null);
  const [newTaskData, setNewTaskData] = useState({ title: '', description: '', urgency: 'Medium' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    fetch(`${API_BASE}/api/volunteers`)
      .then(res => res.json())
      .then(data => setVolunteers(data))
      .catch(err => console.error("Could not fetch volunteers:", err));

    fetch(`${API_BASE}/api/tasks`)
      .then(res => res.json())
      .then(data => setOngoingTasks(data))
      .catch(err => console.error("Could not fetch tasks:", err));
  }, []);

  const formatTime = (timeStr) => {
    if (!timeStr) return "Just now";
    try {
      const diff = Math.floor((new Date() - new Date(timeStr)) / 60000); // in minutes
      if (diff < 1) return "Just now";
      if (diff < 60) return `${diff} minutes ago`;
      if (diff < 1440) return `${Math.floor(diff/60)} hours ago`;
      return `${Math.floor(diff/1440)} days ago`;
    } catch {
      return "Recently";
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocatingVolunteer) return;
    setIsSubmitting(true);
    
    const newTask = {
      title: newTaskData.title,
      description: newTaskData.description,
      urgency: newTaskData.urgency,
      priority: newTaskData.urgency === 'High' ? 'High' : (newTaskData.urgency === 'Critical' ? 'Critical' : 'Medium'),
      time: new Date().toISOString(),
      matches: [{
        name: allocatingVolunteer.name,
        score: 100,
        reason: "Manually allocated by Administrator."
      }]
    };

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        const savedTask = await response.json();
        setOngoingTasks(prev => [savedTask, ...prev]);
        setAllocatingVolunteer(null);
        setNewTaskData({ title: '', description: '', urgency: 'Medium' });
      } else {
        alert("Failed to allocate task");
      }
    } catch (err) {
      console.error("Error allocating task:", err);
      alert("Error allocating task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveVolunteer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove resource allocator: ${name}?`)) return;
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE}/api/volunteers/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setVolunteers(prev => prev.filter(v => v.id !== id));
      } else {
        alert("Failed to remove allocator");
      }
    } catch (err) {
      console.error("Error removing allocator:", err);
      alert("Error removing allocator");
    }
  };

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 border-indigo-500">
          <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Active Volunteers</p>
            <h3 className="text-2xl font-black text-gray-800">{volunteers.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 border-orange-500">
          <div className="p-4 bg-orange-100 rounded-full text-orange-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Tasks Processing</p>
            <h3 className="text-2xl font-black text-gray-800">{ongoingTasks.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 border-red-500">
          <div className="p-4 bg-red-100 rounded-full text-red-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">Critical Alerts</p>
            <h3 className="text-2xl font-black text-gray-800">3</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 glass-panel">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-indigo-500" /> Recent AI Assignments
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {ongoingTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks assigned yet.</p>
            ) : ongoingTasks.map(task => (
               <div key={task.id} className="border border-gray-100 rounded-xl p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                 <div className={`absolute top-0 left-0 w-1.5 h-full ${
                    task.priority === 'Critical' ? 'bg-red-500' :
                    task.priority === 'High' ? 'bg-orange-500' : 'bg-emerald-500'
                 }`}></div>
                 <div className="flex justify-between items-start ml-2">
                   <div className="w-full">
                     <div className="flex items-center space-x-3 mb-1">
                       <h3 className="text-lg font-bold text-gray-900">{task.title}</h3>
                       <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          task.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                       }`}>
                         {task.priority}
                       </span>
                     </div>
                     <p className="text-xs text-gray-400 mb-4">{formatTime(task.time || task.createdAt)}</p>
                     
                     <div className="space-y-2 mt-4 border-t border-gray-50 pt-4">
                       <h4 className="text-sm font-semibold text-gray-600">Matched Team ({task.matches?.length || 0}):</h4>
                       {task.matches && task.matches.map((m, i) => (
                         <div key={i} className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-indigo-900 text-sm">{m.name}</span>
                              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Match: {m.score}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 italic">"{m.reason}"</p>
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 glass-panel">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-500" /> Active Resource Allocators
            </h2>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {volunteers.length === 0 ? (
              <p className="text-gray-500 text-sm">No active resource allocators found. Please register some.</p>
            ) : volunteers.map(vol => (
              <div key={vol.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{vol.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{vol.email}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {vol.skills && (Array.isArray(vol.skills) ? vol.skills : vol.skills.split(',')).map((skill, idx) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-medium border border-blue-100">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
                      <span className="flex items-center bg-gray-50 px-2 py-1 rounded">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> {vol.availability || 'Available'}
                      </span>
                      <span className="flex items-center bg-gray-50 px-2 py-1 rounded">
                        📍 {vol.location || 'Remote'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setAllocatingVolunteer(vol)}
                      className="text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                    >
                      Allocate Task
                    </button>
                    <button 
                      onClick={() => handleRemoveVolunteer(vol.id, vol.name)}
                      className="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-100 w-full"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Allocation Modal */}
      {allocatingVolunteer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => setAllocatingVolunteer(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Direct Allocation</h2>
            <p className="text-sm text-gray-500 mb-6">
              Assigning task to <span className="font-bold text-indigo-600">{allocatingVolunteer.name}</span>
            </p>
            
            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  required type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Emergency Supply Drop"
                  value={newTaskData.title} onChange={e => setNewTaskData({...newTaskData, title: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  required rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none custom-scrollbar"
                  placeholder="Task details..."
                  value={newTaskData.description} onChange={e => setNewTaskData({...newTaskData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
                <select 
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  value={newTaskData.urgency} onChange={e => setNewTaskData({...newTaskData, urgency: e.target.value})}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setAllocatingVolunteer(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
