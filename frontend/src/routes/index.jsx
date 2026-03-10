import { createBrowserRouter } from 'react-router-dom';
import HomePage  from '../pages/HomePage';
import AdminPage from '../pages/AdminPage';

const router = createBrowserRouter([
  { path: '/',      element: <HomePage  /> },
  { path: '/admin', element: <AdminPage /> },
  { path: '*',      element: <HomePage  /> },
]);

export default router;
