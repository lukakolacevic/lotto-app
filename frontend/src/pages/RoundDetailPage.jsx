import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/lotto-app-51b1f/us-central1/api';

function RoundDetailPage() {
  const { roundId } = useParams();
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoundDetails();
  }, [roundId]);

  const fetchRoundDetails = async () => {
    try {
      const historyResponse = await fetch(`${API_BASE}/rounds/history`);
      
      if (!historyResponse.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const history = await historyResponse.json();
      const foundRound = history.find(r => r.id === roundId);
      
      if (!foundRound) {
        setError('Kolo nije pronađeno u povijesti zatvorenih kola.');
        setLoading(false);
        return;
      }

      setRound(foundRound);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching round details:', err);
      setError('Greška pri učitavanju podataka. Provjerite da je backend pokrenut.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Detalji kola</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="container">
        <h1>Greška</h1>
        <div className="error-box">
          {error || 'Kolo nije pronađeno.'}
        </div>
        <Link to="/" className="btn">Povratak na početnu</Link>
      </div>
    );
  }

  return (
    <div className="container round-detail-container">
      <header className="header">
        <div>
          <h1>🎱 Pregled kola</h1>
          <p className="subtitle">Kompletan prikaz informacija o kolu</p>
        </div>
        <Link to="/" className="btn btn-secondary">← Početna</Link>
      </header>

      <main className="round-detail">
        <div className="round-card">
          <div className="round-status-banner">
            <div className="status-badge-wrapper">
              <span className={`badge large ${round.active ? 'active' : 'closed'}`}>
                {round.active ? '🟢 Aktivno kolo' : '🔴 Zatvoreno kolo'}
              </span>
            </div>
            <div className="round-id-display">
              <span className="round-id-label">ID Kola:</span>
              <span className="round-id-value">{round.id}</span>
            </div>
          </div>

          <div className="round-info-section">
            <h3 className="section-title">Informacije o kolu</h3>
            <div className="round-info-grid">
              <div className="info-card">
                <div className="info-icon">📅</div>
                <div className="info-content">
                  <div className="info-label">Datum kreiranja</div>
                  <div className="info-value">
                    {round.createdAt ? new Date(round.createdAt).toLocaleString('hr-HR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'N/A'}
                  </div>
                </div>
              </div>

              {round.closedAt && (
                <div className="info-card">
                  <div className="info-icon">🔒</div>
                  <div className="info-content">
                    <div className="info-label">Datum zatvaranja</div>
                    <div className="info-value">
                      {new Date(round.closedAt).toLocaleString('hr-HR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="info-card highlight">
                <div className="info-icon">🎫</div>
                <div className="info-content">
                  <div className="info-label">Broj uplaćenih listića</div>
                  <div className="info-value large">{round.ticketCount}</div>
                </div>
              </div>
            </div>
          </div>

          {round.results ? (
            <div className="results-section-detail">
              <h3 className="section-title-white">🎲 Izvučeni brojevi</h3>
              <p className="results-subtitle">Dobitna kombinacija ovog kola</p>
              <div className="numbers-display">
                {round.results.map((num, idx) => (
                  <div 
                    key={idx} 
                    className="number-ball-large"
                    style={{animationDelay: `${idx * 0.1}s`}}
                  >
                    {num}
                  </div>
                ))}
              </div>
              <div className="results-footer">
                <p>Ukupno izvučeno: <strong>{round.results.length} brojeva</strong></p>
              </div>
            </div>
          ) : (
            <div className="no-results-section">
              {!round.active ? (
                <>
                  <div className="no-results-icon">⏳</div>
                  <h3>Rezultati još nisu objavljeni</h3>
                  <p>Brojevi za ovo kolo još nisu izvučeni.</p>
                  <p className="hint">Provjerite kasnije za ažurirane rezultate.</p>
                </>
              ) : (
                <>
                  <div className="no-results-icon">🎲</div>
                  <h3>Kolo je aktivno</h3>
                  <p>Ovo kolo je trenutno aktivno i prima uplate.</p>
                  <p className="hint">Brojevi će biti izvučeni nakon zatvaranja kola.</p>
                </>
              )}
            </div>
          )}

          <div className="round-actions">
            <Link to="/" className="btn btn-primary">← Povratak na početnu</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RoundDetailPage;

