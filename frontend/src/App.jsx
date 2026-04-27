import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, PlusCircle, Mic, AlertTriangle, ShieldCheck } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import TaskPosting from './pages/TaskPosting';
import Registration from './pages/Registration';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        {/* Navigation Bar */}
        <nav className="glass-panel sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              AI Volunteer Dispatcher
            </h1>
          </div>
          <div className="flex space-x-6">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link to="/post-task" className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <PlusCircle className="w-5 h-5" />
              <span className="font-medium">Post Task</span>
            </Link>
            <Link to="/register" className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors">
              <Users className="w-5 h-5" />
              <span className="font-medium">Register</span>
            </Link>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/post-task" element={<TaskPosting />} />
            <Route path="/register" element={<Registration />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
