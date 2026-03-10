import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import router from './routes';
import './styles/main.scss';

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}

export default App;
