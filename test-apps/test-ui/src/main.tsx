import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Home from './screens/Home.tsx';
import CallBackPage from './screens/CallBackPage.tsx';
import { ZentryProviders } from './provides/ZentryProvider.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/callback',
    element: <CallBackPage />,
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ZentryProviders>
      <RouterProvider router={router} />
    </ZentryProviders>
  </StrictMode>,
);
