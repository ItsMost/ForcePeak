import React from 'react';
import WeeklyPlanner from './components/WeeklyPlanner/index.jsx';
import './index.css';
import './App.css';

function App() {
  return (
    <div className="App selection:bg-orange-500/20 antialiased font-sans">
      <WeeklyPlanner />
    </div>
  );
}

export default App;