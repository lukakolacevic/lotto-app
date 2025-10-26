import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function HomePage() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
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
        <h1>🎱 Loto 6/45</h1>
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
              <p>Trenutno nema aktivnih kola.</p>
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
      </main>

      <footer className="footer">
        <p>Loto aplikacija - Demo projekt</p>
      </footer>
    </div>
  );
}

export default HomePage;

