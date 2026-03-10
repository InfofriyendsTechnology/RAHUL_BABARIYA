import { motion } from 'framer-motion';
import { FiMapPin, FiExternalLink } from 'react-icons/fi';
import './LocationSection.scss';

const LocationSection = ({ address }) => {
  const query      = encodeURIComponent(address || 'Gujarat, India');
  const mapsUrl    = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const embedUrl   = `https://maps.google.com/maps?q=${query}&output=embed&z=10`;

  return (
    <section className="location section" id="location">
      <div className="container">
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55 }}
        >
          <span className="badge"><FiMapPin size={12} /> Location</span>
          <h2>Find Us</h2>
          <p>Visit our studio or connect for outdoor &amp; event shoots</p>
        </motion.div>

        <motion.div
          className="location__card"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Map iframe */}
          <div className="location__map">
            <iframe
              title="Studio Location"
              src={embedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Address row */}
          <div className="location__info">
            <FiMapPin size={20} className="location__pin-icon" />
            <div className="location__details">
              <p className="location__addr">{address || 'Gujarat, India'}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="location__dir-btn"
              >
                Get Directions <FiExternalLink size={13} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LocationSection;
