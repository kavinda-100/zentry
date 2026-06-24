import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import Home from './screens/Home.tsx';
import CallBackPage from './screens/CallBackPage.tsx';

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

function App() {
  return <RouterProvider router={router} />;
}

export default App;
