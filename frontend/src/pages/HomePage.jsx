import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/lotto-app-51b1f/us-central1/api';

function HomePage() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
    fetchHistory();
    if (isAuthenticated) {
      fetchMyTickets();
    }
  }, [isAuthenticated]);

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

  const fetchMyTickets = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${API_BASE}/my-tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMyTickets(data);
      }
    } catch (error) {
      console.error('Error fetching my tickets:', error);
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

        <div className="two-column-section">
          {isAuthenticated && (
            <section className="my-tickets-section">
              <h2>Moji listići</h2>
              {myTickets.length === 0 ? (
                <div className="info-box">
                  <p>Nemate uplaćenih listića.</p>
                </div>
              ) : (
                <div className="tickets-list">
                  {myTickets.map((ticket) => (
                    <Link key={ticket.id} to={`/ticket/${ticket.id}`} className="ticket-item">
                      <div className="ticket-item-header">
                        <span className="ticket-id">ID: {ticket.id.substring(0, 8)}...</span>
                        <span className="ticket-date">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('hr-HR') : 'N/A'}
                        </span>
                      </div>
                      <div className="ticket-item-numbers">
                        {ticket.numbers.map((num, idx) => (
                          <span key={idx} className="mini-ball">{num}</span>
                        ))}
                      </div>
                      {ticket.results && (
                        <div className="ticket-item-status">
                          ✓ Rezultati dostupni
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="history-section">
            <h2>Rezultati prethodnih 5 kola</h2>
          {history.length === 0 ? (
            <div className="info-box">
              <p>Nema zatvorenih kola.</p>
            </div>
          ) : (
            <div className="history-list">
              {history.map((round) => (
                <Link key={round.id} to={`/round/${round.id}`} className="history-item clickable">
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
                </Link>
              ))}
            </div>
          )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>Loto aplikacija - Demo projekt</p>
      </footer>
    </div>
  );
}

export default HomePage;

