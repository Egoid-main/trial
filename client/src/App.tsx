import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TestPage from './components/TestPage';
import ResultsPage from './components/ResultsPage';
import AdminDashboard from './components/AdminDashboard';
import HomePage from './components/HomePage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/results/:responseId" element={<ResultsPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
