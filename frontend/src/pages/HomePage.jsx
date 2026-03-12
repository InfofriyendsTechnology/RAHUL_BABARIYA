import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPhone, FiMapPin, FiDownload, FiCamera, FiSun, FiMoon, FiX,
} from 'react-icons/fi';
import { FaWhatsapp, FaYoutube, FaFacebook } from 'react-icons/fa';
import { fetchPortfolio } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import './HomePage.scss';

// ── Official brand SVG logos ──────────────────────────────────────────────────
//  Instagram: gradient bg + camera-housing outline + lens ring + flash dot
const IgIcon = ({ size = 24 }) => {
  const id = useRef(`ig_${Math.random().toString(36).slice(2)}`).current;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <defs>
        <radialGradient id={id} r="150%" cx="30%" cy="107%">
          <stop stopColor="#fdf497" offset="0"/>
          <stop stopColor="#fdf497" offset=".05"/>
          <stop stopColor="#fd5949" offset=".45"/>
          <stop stopColor="#d6249f" offset=".6"/>
          <stop stopColor="#285AEB" offset=".9"/>
        </radialGradient>
      </defs>
      {/* Gradient background */}
      <rect width="24" height="24" rx="5.5" fill={`url(#${id})`}/>
      {/* Camera body — the outer rounded-square outline */}
      <rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="white" strokeWidth="1.5"/>
      {/* Lens ring */}
      <circle cx="12" cy="12" r="4.3" stroke="white" strokeWidth="1.5" fill="none"/>
      {/* Flash dot */}
      <circle cx="17.4" cy="6.6" r="1.2" fill="white"/>
    </svg>
  );
};

//  Google Maps: simple clean pin icon
const MapsIcon = ({ size = 24 }) => <FiMapPin size={size} color="#EA4335" strokeWidth={2.5}/>;

// ── Business vCard download
const downloadBizVCard = (biz) => {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${biz.name}`,
    `ORG:${biz.name}`,
  ];
  if (biz.phone)   lines.push(`TEL;TYPE=WORK:${biz.phone}`);
  if (biz.address) lines.push(`ADR:;;${biz.address};;;;`);
  lines.push('END:VCARD');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/vcard' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {
    href: url, download: `${biz.name.replace(/\s+/g, '_')}.vcf`,
  });
  a.click();
  URL.revokeObjectURL(url);
};

// ── Company contact bottom-sheet (used inside each BizTile) ───────────────────
const BizContactPopup = ({ biz, onClose }) => (
  <div className="contact-overlay" onClick={onClose}>
    <motion.div
      className="contact-sheet"
      initial={{ scale: 0.82, opacity: 0 }}
      animate={{ scale: 1,    opacity: 1 }}
      exit={{ scale: 0.82,    opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 320 }}
      onClick={e => e.stopPropagation()}
    >
      <div className="contact-sheet__handle" />
      <div className="contact-sheet__header">
        <div className="contact-sheet__biz-info">
          {biz.logo && <img src={biz.logo} alt={biz.name} className="contact-sheet__biz-logo" />}
          <h3 className="contact-sheet__title">{biz.name}</h3>
        </div>
        <button className="contact-sheet__close" onClick={onClose}><FiX size={18} /></button>
      </div>
      <div className="contact-sheet__options">
        <button
          className="contact-sheet__opt contact-sheet__opt--save"
          onClick={() => { downloadBizVCard(biz); onClose(); }}
        >
          <span className="cso-icon"><FiDownload size={22} /></span>
          <span className="cso-label">Save Number</span>
        </button>
        {biz.phone && (
          <a
            href={`tel:${biz.phone}`}
            className="contact-sheet__opt contact-sheet__opt--call"
            onClick={onClose}
          >
            <span className="cso-icon"><FiPhone size={22} /></span>
            <span className="cso-label">Call Now</span>
          </a>
        )}
        {biz.phone && (
          <a
            href={`https://wa.me/${biz.phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-sheet__opt contact-sheet__opt--wa"
            onClick={onClose}
          >
            <span className="cso-icon"><FaWhatsapp size={22} /></span>
            <span className="cso-label">WhatsApp Chat</span>
          </a>
        )}
      </div>
    </motion.div>
  </div>
);

// ── Brand icon map & colours ───────────────────────────────────────────────────
const ICON_MAP = {
  instagram: IgIcon,     // official Instagram gradient logo (SVG)
  youtube:   FaYoutube,
  facebook:  FaFacebook,
  whatsapp:  FaWhatsapp,
  maps:      MapsIcon,
};
const BRAND_COLOR = {
  instagram: null,       // SVG has own gradient
  youtube:   '#FF0000',
  facebook:  '#1877F2',
  whatsapp:  '#25D366',
  maps:      null,       // component has own color
};

// ── Business Detail Modal ──────────────────────────────────────────────────
const BizDetailModal = ({ biz, onClose, onContact }) => {
  const [slideIdx, setSlideIdx] = useState(0);
  const touchStartX = useRef(null);

  const gallery = (biz?.gallery || []).filter(g => g.url);
  const socials = (biz?.socialLinks || []).filter(s => s.url && s.platform !== 'maps');
  const mapsEntry = (biz?.socialLinks || []).find(s => s.platform === 'maps' && s.url);
  const bizMapsUrl = mapsEntry?.url
    || (biz?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address)}`
      : null);

  useEffect(() => {
    if (gallery.length <= 1) return;
    const t = setInterval(
      () => setSlideIdx(i => (i + 1) % gallery.length), 3500
    );
    return () => clearInterval(t);
  }, [gallery.length]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null || gallery.length < 2) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40)
      setSlideIdx(i => diff < 0
        ? (i + 1) % gallery.length
        : (i - 1 + gallery.length) % gallery.length
      );
    touchStartX.current = null;
  };

  return (
    <div className="biz-modal-overlay" onClick={onClose}>
      <motion.div
        className="biz-modal"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
      >
        <button className="biz-modal__close" onClick={onClose}>
          <FiX size={24} />
        </button>

        {/* Business Info */}
        <div className="biz-modal__info">
          <div className="biz-modal__header">
            {biz.logo && <img src={biz.logo} alt={biz.name} className="biz-modal__logo" />}
            <div>
              <h2 className="biz-modal__name">{biz.name}</h2>
              {biz.tagline && <p className="biz-modal__tagline">{biz.tagline}</p>}
            </div>
          </div>

          {/* Social Icons */}
          <div className="biz-modal__socials">
            {biz.phone && (
              <button
                className="biz-modal__social"
                onClick={() => { onContact(biz); onClose(); }}
                title="Contact"
              >
                <FaWhatsapp size={24} color="#25D366" />
              </button>
            )}
            {bizMapsUrl && (
              <a
                href={bizMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="biz-modal__social"
                title="View on Google Maps"
              >
                <MapsIcon size={24} />
              </a>
            )}
            {socials.map((s, i) => {
              const Icon = ICON_MAP[s.platform] || FaYoutube;
              const color = BRAND_COLOR[s.platform];
              return (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="biz-modal__social"
                  title={s.label}
                >
                  {color ? <Icon size={24} color={color} /> : <Icon size={24} />}
                </a>
              );
            })}
          </div>
        </div>

        {/* Gallery */}
        {gallery.length > 0 && (
          <div
            className="biz-modal__gallery"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              key={`bg-${slideIdx}`}
              className="biz-modal__gallery-bg"
              style={{ backgroundImage: `url(${gallery[slideIdx].url})` }}
            />
            <img
              key={slideIdx}
              src={gallery[slideIdx].url}
              alt={gallery[slideIdx].caption || biz.name}
              className="biz-modal__gallery-img"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

// ── Business tile with slideshow ─────────────────────────────────────────────
const BizTile = ({ biz, delay = 0, onOpenDetail }) => {
  const touchStartX = useRef(null);

  if (!biz?.name) return null;

  return (
    <motion.div
      className="biz-tile"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={() => onOpenDetail(biz)}
      style={{ cursor: 'pointer' }}
    >
      <div className="biz-tile__content">
        <div className="biz-tile__logo-wrap">
          {biz.logo
            ? <img src={biz.logo} alt={biz.name} className="biz-tile__logo" />
            : <div className="biz-tile__logo-ph"><FiCamera size={24} /></div>
          }
        </div>
        <h3 className="biz-tile__name">{biz.name}</h3>
        {biz.tagline && <p className="biz-tile__tagline">{biz.tagline}</p>}
      </div>
    </motion.div>
  );
};

// ── Default fallback data ─────────────────────────────────────────────────────
const DEFAULT = {
  owner: {
    name: 'Rahul Babariya', tagline: 'Photographer & Creative Director',
    address: 'Surat, Gujarat, India', phone: '', whatsapp: '',
  },
  businesses: { aurpix: null, dada: null },
  socialLinks: [],
};

// ── HomePage ──────────────────────────────────────────────────────────────────
const HomePage = () => {
  const [data,       setData]      = useState(DEFAULT);
  const [loading,    setLoading]   = useState(true);
  const [bizContact, setBizContact] = useState(null); // biz object when popup open
  const [bizDetail,  setBizDetail] = useState(null);  // biz object for detail modal
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    fetchPortfolio()
      .then(res => { if (res.data?.data) setData(res.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="page-loader__spinner" />
      </div>
    );
  }

  const { owner, businesses } = data;
  const mapQuery = encodeURIComponent(owner?.address || 'Surat, Gujarat, India');
  const mapsUrl  = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  const socialLinks  = data.socialLinks || [];
  const igLink  = socialLinks.find(s => s.platform === 'instagram')?.url;
  const ytLink  = socialLinks.find(s => s.platform === 'youtube')?.url;

  return (
    <div className="dc">

      {/* Company contact bottom-sheet — rendered at page level so it overlays everything */}
      <AnimatePresence>
        {bizContact && (
          <BizContactPopup biz={bizContact} onClose={() => setBizContact(null)} />
        )}
      </AnimatePresence>

      {/* Business detail modal */}
      <AnimatePresence>
        {bizDetail && (
          <BizDetailModal 
            biz={bizDetail} 
            onClose={() => setBizDetail(null)}
            onContact={setBizContact}
          />
        )}
      </AnimatePresence>

      {/* ── Card ── */}
      <main className="dc__card">
        {/* Tree Structure */}
        {/* Tree Structure */}
        <div className="tree-structure">
          {/* Owner Node */}
          <motion.div
            className="tree-node tree-node--owner"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="tree-node__avatar">
              {owner?.photo
                ? <img src={owner.photo} alt={owner.name} />
                : <FiCamera size={28} />
              }
            </div>
            <h2 className="tree-node__name">{owner?.name || 'Rahul Babariya'}</h2>
            <p className="tree-node__title">{owner?.tagline || 'Photographer & Creative Director'}</p>
          </motion.div>

          {/* Connector Line */}
          <motion.div
            className="tree-connector"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          />

          {/* Business Branches */}
          <div className="tree-branches">
            {businesses?.aurpix && (
              <motion.div
                className="tree-node tree-node--business"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                onClick={() => setBizDetail(businesses.aurpix)}
              >
                <div className="tree-node__logo">
                  {businesses.aurpix.logo
                    ? <img src={businesses.aurpix.logo} alt={businesses.aurpix.name} />
                    : <FiCamera size={24} />
                  }
                </div>
                <h3 className="tree-node__biz-name">{businesses.aurpix.name}</h3>
                <p className="tree-node__biz-tag">{businesses.aurpix.tagline}</p>
              </motion.div>
            )}

            {businesses?.dada && (
              <motion.div
                className="tree-node tree-node--business"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                onClick={() => setBizDetail(businesses.dada)}
              >
                <div className="tree-node__logo">
                  {businesses.dada.logo
                    ? <img src={businesses.dada.logo} alt={businesses.dada.name} />
                    : <FiCamera size={24} />
                  }
                </div>
                <h3 className="tree-node__biz-name">{businesses.dada.name}</h3>
                <p className="tree-node__biz-tag">{businesses.dada.tagline}</p>
              </motion.div>
            )}
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="dc__footer">
        <button className="dc__theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {isDark ? <FiSun size={13} /> : <FiMoon size={13} />}
        </button>
        © {new Date().getFullYear()} {owner?.name || 'Rahul Babariya'}
        <a href="/admin" className="dc__admin-dot" aria-label="Admin">·</a>
      </footer>

    </div>
  );
};

export default HomePage;
