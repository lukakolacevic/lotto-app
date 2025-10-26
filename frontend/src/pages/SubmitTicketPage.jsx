import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

function SubmitTicketPage() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const [idNumber, setIdNumber] = useState('');
  const [numbers, setNumbers] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isAuthenticated) {
        await loginWithRedirect();
        return;
      }

      const token = await getAccessTokenSilently();

      const response = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          idNumber: idNumber.trim(),
          numbers: numbers.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessages = {
          'id_number_length_1_20': 'Broj osobne mora biti između 1 i 20 znakova.',
          'numbers_count_6_10': 'Morate unijeti između 6 i 10 brojeva.',
          'duplicates_not_allowed': 'Brojevi se ne smiju ponavljati.',
          'out_of_range_1_45': 'Svi brojevi moraju biti u rasponu od 1 do 45.',
          'no_active_round': 'Trenutno nema aktivnog kola za uplatu.',
        };
        throw new Error(errorMessages[errorData.error] || 'Greška pri uplati listića.');
      }

      // Response is image/png (QR code)
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setQrImage(imageUrl);

      // Clear form
      setIdNumber('');
      setNumbers('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container">
        <div className="info-box warning">
          <p>Morate biti prijavljeni za uplatu listića.</p>
          <button onClick={() => loginWithRedirect()} className="btn">
            Prijava
          </button>
        </div>
      </div>
    );
  }

  if (qrImage) {
    return (
      <div className="container">
        <h1>✅ Listić uspješno uplaćen!</h1>
        <div className="qr-result">
          <p>Spremite ili skenirajte QR kod za pregled listića:</p>
          <img src={qrImage} alt="QR kod listića" className="qr-image" />
          <div className="button-group">
            <button onClick={() => setQrImage(null)} className="btn">
              Uplati novi listić
            </button>
            <Link to="/" className="btn btn-secondary">
              Povratak na početnu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>📝 Uplata listića</h1>
        <Link to="/" className="btn btn-secondary">← Natrag</Link>
      </header>

      <main className="form-content">
        <form onSubmit={handleSubmit} className="ticket-form">
          <div className="form-group">
            <label htmlFor="idNumber">
              Broj osobne iskaznice ili putovnice:
            </label>
            <input
              type="text"
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              maxLength={20}
              required
              placeholder="npr. 123456789"
            />
            <small>Maksimalno 20 znakova</small>
          </div>

          <div className="form-group">
            <label htmlFor="numbers">
              Brojevi (6-10 brojeva, raspon 1-45, odvojeni zarezom):
            </label>
            <input
              type="text"
              id="numbers"
              value={numbers}
              onChange={(e) => setNumbers(e.target.value)}
              required
              placeholder="npr. 5, 12, 23, 34, 41, 45"
            />
            <small>Primjer: 1, 7, 15, 22, 33, 42</small>
          </div>

          {error && (
            <div className="error-box">
              ❌ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uplaćivanje...' : 'Uplati listić'}
          </button>
        </form>

        <div className="info-box">
          <h3>Upute:</h3>
          <ul>
            <li>Unesite broj osobne iskaznice ili putovnice (1-20 znakova)</li>
            <li>Unesite 6 do 10 brojeva iz raspona 1-45</li>
            <li>Brojeve odvojite zarezom</li>
            <li>Brojevi se ne smiju ponavljati</li>
            <li>Nakon uspješne uplate dobit ćete QR kod</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default SubmitTicketPage;

