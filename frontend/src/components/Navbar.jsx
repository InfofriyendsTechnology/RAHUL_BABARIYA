import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import './Navbar.scss';

const Navbar = ({ ownerName }) => {
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        <a href="#" className="navbar__brand">
          {ownerName || 'Rahul Babariya'}
        </a>
        <button
          className={`navbar__theme-btn${isDark ? ' active' : ''}`}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          <span className="navbar__theme-knob" />
          <FiSun  size={11} className="navbar__theme-sun"  />
          <FiMoon size={11} className="navbar__theme-moon" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
