import { useState } from 'react';
import type { ZentrySessionType } from '@zentry-org/sdk/react';
import { useZentry } from '@zentry-org/sdk/react';
import axios from 'axios';

const Backend = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<ZentrySessionType | null>(null);
  const { getSessionToken } = useZentry();

  async function handleClick() {
    const token = getSessionToken();
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await axios.get('http://localhost:8000/zentry-user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <h1>Backend</h1>
      {isLoading && <p>Loading...</p>}
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};
export default Backend;
