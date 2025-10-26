import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/lotto-app-51b1f/us-central1/api';

function HomePage() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/rounds/history`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container">
        <h1>Loto 6/45</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>🎱 Loregreto 6/45</h1>
        {isAuthenticated ? (
          <div className="user-info">
            <span>Prijavljeni kao: <strong>{user?.email || user?.name}</strong></span>
            <button onClick={() => logout({ returnTo: window.location.origin })}>
              Odjava
            </button>
          </div>
        ) : (
          <button onClick={() => loginWithRedirect()}>
            Prijava
          </button>
        )}
      </header>

      <main className="main-content">
        <section className="status-section">
          <h2>Status trenutnog kola</h2>
          
          {!status?.hasRound ? (
            <div className="info-box">
              <p>Uplate trenutno nisu aktivne.</p>
            </div>
          ) : (
            <>
              <div className="info-box">
                <div className="info-item">
                  <span className="label">Status kola:</span>
                  <span className={`badge ${status.active ? 'active' : 'closed'}`}>
                    {status.active ? 'Uplate aktivne' : 'Uplate zatvorene'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Broj uplaćenih listića:</span>
                  <span className="value">{status.ticketCount}</span>
                </div>
              </div>

              {status.results && (
                <div className="results-box">
                  <h3>Izvučeni brojevi:</h3>
                  <div className="numbers">
                    {status.results.map((num, idx) => (
                      <span key={idx} className="number-ball">{num}</span>
                    ))}
                  </div>
                </div>
              )}

              {status.active && isAuthenticated && (
                <div className="action-box">
                  <Link to="/submit" className="btn btn-primary">
                    Uplati listić
                  </Link>
                </div>
              )}

              {status.active && !isAuthenticated && (
                <div className="info-box warning">
                  <p>⚠️ Za uplatu listića morate biti prijavljeni.</p>
                  <button onClick={() => loginWithRedirect()} className="btn">
                    Prijavite se
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="history-section">
          <h2>Rezultati prethodnih 5 kola</h2>
          {history.length === 0 ? (
            <div className="info-box">
              <p>Nema prethodnih kola.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((round) => (
                <div key={round.id} className="history-item">
                  <div className="history-header">
                    <span className={`badge ${round.active ? 'active' : 'closed'}`}>
                      {round.active ? 'Aktivno' : 'Zatvoreno'}
                    </span>
                    <span className="history-date">
                      {round.createdAt ? new Date(round.createdAt).toLocaleDateString('hr-HR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="history-info">
                    <span>Broj uplaćenih listića: <strong>{round.ticketCount}</strong></span>
                  </div>
                  {round.results && (
                    <div className="history-results">
                      <span className="results-label">Izvučeni brojevi:</span>
                      <div className="numbers small">
                        {round.results.map((num, idx) => (
                          <span key={idx} className="number-ball small">{num}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Loto aplikacija - Demo projekt</p>
      </footer>
    </div>
  );
}

export default HomePage;

