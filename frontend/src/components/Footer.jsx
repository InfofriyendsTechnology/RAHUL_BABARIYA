import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa';
import './Footer.scss';

const Footer = ({ owner }) => {
  const waNumber = owner?.whatsapp || owner?.phone;
  const waLink   = waNumber
    ? `https://wa.me/${waNumber}?text=Hi%20${encodeURIComponent(owner?.name || 'Rahul')}%2C%20I%27d%20like%20to%20book%20a%20session!`
    : '#';

  return (
    <>
      <footer className="footer">
        <div className="container footer__inner">
          <p className="footer__copy">
            © {new Date().getFullYear()} {owner?.name || 'Rahul Babariya'}. All rights reserved.
          </p>
          <a href="/admin" className="footer__admin">Admin</a>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      {waNumber && (
        <motion.a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="wa-fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 2, type: 'spring', stiffness: 260, damping: 20 }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.92 }}
          aria-label="Chat on WhatsApp"
        >
          <FaWhatsapp size={28} />
          <span className="wa-fab__tooltip">Book a Session</span>
        </motion.a>
      )}
    </>
  );
};

export default Footer;
