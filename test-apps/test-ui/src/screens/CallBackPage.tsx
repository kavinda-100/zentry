import { useZentryCallbackSync } from '@zentry-org/sdk/react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';

const CallBackPage = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(60);
  const { isLoading, success, message } = useZentryCallbackSync();

  useEffect(() => {
    if (!success) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/');
    }, 1200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigate, success]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCount((prevCount) => {
        if (prevCount <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }

        return prevCount - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        textAlign: 'center',
        padding: '1.5rem',
      }}
    >
      <h1>Finishing sign-in...</h1>
      <p>
        {isLoading
          ? 'We are syncing your session.'
          : message ?? 'Callback processing finished.'}
      </p>
      {success && <p>Redirecting you to the home page...</p>}
      {!success && !isLoading && (
        <p>If nothing happens, you can return home in {count}s.</p>
      )}
      <Link to="/">Return to Home</Link>
    </div>
  );
};
export default CallBackPage;
