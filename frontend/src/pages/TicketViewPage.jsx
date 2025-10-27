import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5173/api';

function TicketViewPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`${API_BASE}/tickets/${ticketId}`);
      
      if (!response.ok) {
        throw new Error('Listić nije pronađen.');
      }

      const data = await response.json();
      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Pregled listića</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>❌ Greška</h1>
        <div className="error-box">
          {error}
        </div>
        <Link to="/" className="btn">Povratak na početnu</Link>
      </div>
    );
  }

  const hasMatches = ticket?.results && ticket?.numbers;
  const matches = hasMatches 
    ? ticket.numbers.filter(num => ticket.results.includes(num))
    : [];

  return (
    <div className="container">
      <header className="header">
        <h1>🎫 Pregled listića</h1>
        <Link to="/" className="btn btn-secondary">← Početna</Link>
      </header>

      <main className="ticket-view">
        <div className="ticket-card">
          <div className="ticket-header-banner">
            <h2>Informacije o listiću</h2>
          </div>

          <div className="ticket-info">
            <div className="info-item">
              <span className="label">ID listića:</span>
              <span className="value mono">{ticket.ticketId}</span>
            </div>
            <div className="info-item">
              <span className="label">Broj osobne iskaznice:</span>
              <span className="value">{ticket.idNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">ID kola:</span>
              <span className="value mono">{ticket.roundId}</span>
            </div>
          </div>

          <div className="ticket-numbers">
            <h3>Vaši odabrani brojevi:</h3>
            <div className="numbers">
              {ticket.numbers.map((num, idx) => (
                <span 
                  key={idx} 
                  className={`number-ball ${matches.includes(num) ? 'match' : ''}`}
                >
                  {num}
                </span>
              ))}
            </div>
            <p className="numbers-count">
              Ukupno odabranih brojeva: <strong>{ticket.numbers.length}</strong>
            </p>
          </div>

          <div className="divider"></div>

          {ticket.results ? (
            <>
              <div className="results-section">
                <h3>Izvučeni brojevi u ovom kolu:</h3>
                <div className="numbers">
                  {ticket.results.map((num, idx) => (
                    <span 
                      key={idx} 
                      className={`number-ball drawn ${ticket.numbers.includes(num) ? 'match' : ''}`}
                    >
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              <div className={`match-result ${matches.length > 0 ? 'success' : ''}`}>
                <h2>
                  {matches.length > 0 ? '🎉 ' : ''}
                  Pogodaka: {matches.length}/{ticket.results.length}
                </h2>
                {matches.length > 0 ? (
                  <div className="matched-numbers">
                    <p>Čestitamo! Pogodili ste sljedeće brojeve:</p>
                    <div className="numbers">
                      {matches.map((num, idx) => (
                        <span key={idx} className="number-ball match">{num}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="no-matches">Nažalost, niste pogodili nijedan broj u ovom kolu.</p>
                )}
              </div>
            </>
          ) : (
            <div className="info-box warning no-results">
              <h3>Rezultati još nisu dostupni</h3>
              <p>⏳ Brojevi za ovo kolo još nisu izvučeni.</p>
              <p>Molimo pokušajte kasnije ili provjerite na početnoj stranici kada će rezultati biti objavljeni.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TicketViewPage;

