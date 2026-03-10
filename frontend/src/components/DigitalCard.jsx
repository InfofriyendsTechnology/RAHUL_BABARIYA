import { motion } from 'framer-motion';
import { FaWhatsapp, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';
import './DigitalCard.scss';

const ICON_MAP = { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp };

const PLATFORM_STYLE = {
  instagram: { bg: 'linear-gradient(45deg,#f09433,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888)' },
  facebook:  { bg: '#1877F2' },
  youtube:   { bg: '#FF0000' },
  whatsapp:  { bg: '#25D366' },
};

const DigitalCard = ({ socialLinks }) => {
  const active = (socialLinks || []).filter(s => s.url);
  if (active.length === 0) return null;

  return (
    <section className="connect section" id="contact">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55 }}
        >
          <span className="badge">Follow Us</span>
          <h2>Stay Connected</h2>
          <p>Follow our work across social media platforms</p>
        </motion.div>

        <div className="connect__grid">
          {active.map((s, i) => {
            const Icon  = ICON_MAP[s.icon] || FaInstagram;
            const style = PLATFORM_STYLE[s.platform] || { bg: '#B68973' };
            return (
              <motion.a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="connect__item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className="connect__icon"
                  style={{ background: style.bg }}
                >
                  <Icon size={30} color="#fff" />
                </div>
                <span className="connect__label">{s.label}</span>
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default DigitalCard;
