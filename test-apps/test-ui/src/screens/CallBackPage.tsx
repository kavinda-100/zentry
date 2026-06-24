import { useZentryCallbackSync } from '@zentry-org/sdk/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

const CallBackPage = () => {
  const [count, setCount] = useState(60);

  // sync the callback
  useZentryCallbackSync();

  // wait for 60 seconds
  useEffect(() => {
    setTimeout(() => {
      setCount((prevCount) => (prevCount === 0 ? 0 : prevCount - 1));
    }, 60000);

    return () => {};
  }, [count]);

  return (
    <div>
      CallBackPage wait for {count} seconds
      {count === 0 && <Link to={'/'}>Go to Home</Link>}
    </div>
  );
};
export default CallBackPage;
