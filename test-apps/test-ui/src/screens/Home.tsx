import {
  Authenticated,
  LoginButton,
  LogoutButton,
  RegisterButton,
  UnAuthenticated,
  useZentry,
} from '@zentry-org/sdk/react';
import { Link } from 'react-router';

const Home = () => {
  const { session, isLoading, isAuthenticated } = useZentry();

  return (
    <main className="page-shell">
      <div className="page-frame">
        <section className="hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Zentry Test UI</span>
            <h1 className="page-title">Organization auth test app.</h1>
            <p className="page-subtitle">
              A lightweight screen for checking Zentry register, login, session sync, and backend
              integration without the noisy developer layout.
            </p>
            <div
              className={`status-badge ${isLoading ? 'is-loading' : isAuthenticated ? 'is-success' : ''}`}
            >
              {isLoading
                ? 'Syncing your Zentry session'
                : isAuthenticated
                  ? 'Authenticated with Zentry'
                  : 'Waiting for sign in'}
            </div>
          </div>
        </section>

        <UnAuthenticated>
          <section className="content-card">
            <div className="stack-sm">
              <h2 className="section-heading">Continue with your organization flow</h2>
              <p className="section-copy">
                Sign in or register through Zentry, then come back here to inspect the normalized
                session payload.
              </p>
            </div>
            <div className="actions-row">
              <RegisterButton className="button" />
              <LoginButton className="button-secondary" />
            </div>
          </section>
        </UnAuthenticated>

        <Authenticated>
          <section className="content-card">
            <div className="content-topbar">
              <div className="stack-sm">
                <h2 className="section-heading">Raw session payload</h2>
                <p className="section-copy">
                  The full normalized response returned by Zentry for the current organization
                  session.
                </p>
              </div>
              <div className="actions-row">
                <Link className="button-secondary" to="/backend">
                  Backend check
                </Link>
                <LogoutButton className="button-ghost" label="Sign out" />
              </div>
            </div>

            {session ? (
              <div className="raw-card">
                <pre>{JSON.stringify(session, null, 2)}</pre>
              </div>
            ) : (
              <p className="section-copy">
                No session payload is available yet. Try refreshing to trigger another sync.
              </p>
            )}
          </section>
        </Authenticated>
      </div>
    </main>
  );
};

export default Home;
