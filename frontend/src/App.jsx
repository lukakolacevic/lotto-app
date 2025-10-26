import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SubmitTicketPage from './pages/SubmitTicketPage';
import TicketViewPage from './pages/TicketViewPage';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/submit" element={<SubmitTicketPage />} />
        <Route path="/ticket/:ticketId" element={<TicketViewPage />} />
      </Routes>
    </div>
  );
}

export default App;
