import { useState } from 'react';
import type { ZentrySessionType } from '@zentry-org/sdk/react';
import { useZentry } from '@zentry-org/sdk/react';
import { Link } from 'react-router';
import axios from 'axios';

const Backend = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ZentrySessionType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { getSessionToken } = useZentry();

  async function handleClick() {
    const token = getSessionToken();
    if (!token) {
      setErrorMessage('No session token was found. Please sign in through Zentry first.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const response = await axios.get('http://localhost:8000/zentry-user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setData(response.data?.user);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('The backend request failed. Check the API server and token flow.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <div className="page-frame">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Backend Validation</span>
            <h1 className="page-title">Backend session check.</h1>
            <p className="page-subtitle">
              Send the current bearer token to your backend and inspect the exact session payload
              returned by the protected endpoint.
            </p>
            <div
              className={`status-badge ${isLoading ? 'is-loading' : data ? 'is-success' : errorMessage ? 'is-danger' : ''}`}
            >
              {isLoading
                ? 'Fetching session from backend'
                : data
                  ? 'Backend session loaded'
                  : errorMessage
                    ? 'Backend request failed'
                    : 'Ready to test backend integration'}
            </div>
          </div>
        </section>

        <section className="content-card">
          <div className="content-topbar">
            <div className="stack-sm">
              <h2 className="section-heading">Raw session payload</h2>
              <p className="section-copy">
                Fetch the full normalized response returned by your backend after Zentry token
                validation.
              </p>
            </div>
            <div className="actions-row">
              <button className="button" onClick={handleClick} disabled={isLoading}>
                {isLoading ? 'Fetching...' : 'Fetch backend data'}
              </button>
              <Link className="button-secondary" to="/">
                Back to home
              </Link>
            </div>
          </div>

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

          {data ? (
            <div className="raw-card">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          ) : (
            <p className="section-copy">
              No backend payload yet. Click fetch to call your protected endpoint.
            </p>
          )}
        </section>
      </div>
    </main>
  );
};

export default Backend;
