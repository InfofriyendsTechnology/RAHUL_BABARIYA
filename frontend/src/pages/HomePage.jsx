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

// ── Business tile with slideshow ─────────────────────────────────────────────
const BizTile = ({ biz, delay = 0, onContact }) => {
  const [slideIdx,  setSlideIdx]  = useState(0);
  const touchStartX = useRef(null);

  const gallery  = (biz?.gallery    || []).filter(g => g.url);
  // Filter maps out of socials — we show ONE maps icon separately below
  const socials   = (biz?.socialLinks || []).filter(s => s.url && s.platform !== 'maps');
  // Maps URL: prefer manual entry in socialLinks, else auto from address
  const mapsEntry  = (biz?.socialLinks || []).find(s => s.platform === 'maps' && s.url);
  const bizMapsUrl = mapsEntry?.url
    || (biz?.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(biz.address)}`
      : null);

  // Auto-advance every 3.5 s
  useEffect(() => {
    if (gallery.length <= 1) return;
    const t = setInterval(
      () => setSlideIdx(i => (i + 1) % gallery.length), 3500
    );
    return () => clearInterval(t);
  }, [gallery.length]);

  if (!biz?.name) return null;

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
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
    <motion.div
      className="biz-tile"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      {/* Top: logo + name + tagline */}
      <div className="biz-tile__top">
        <div className="biz-tile__head">
          <div className="biz-tile__logo-wrap">
            {biz.logo
              ? <img src={biz.logo} alt={biz.name} className="biz-tile__logo" />
              : <div className="biz-tile__logo-ph"><FiCamera size={18} /></div>
            }
          </div>
          <div className="biz-tile__meta">
            <span className="biz-tile__name">{biz.name}</span>
            {biz.tagline && <span className="biz-tile__tagline">{biz.tagline}</span>}
          </div>
        </div>

        {/* All icons in ONE row: WhatsApp (popup) + social links together */}
        {(biz.phone || socials.length > 0 || bizMapsUrl) && (
          <div className="biz-tile__socials">
            {/* WhatsApp icon — triggers 3-option popup */}
            {biz.phone && (
              <button
                className="biz-tile__social biz-tile__social--btn"
                onClick={() => onContact(biz)}
                title="Contact"
              >
                <FaWhatsapp size={24} color="#25D366" />
              </button>
            )}
            {/* Auto Google Maps icon from business address */}
            {bizMapsUrl && (
              <a
                href={bizMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="biz-tile__social"
                title="View on Google Maps"
              >
                <MapsIcon size={24} />
              </a>
            )}
            {/* Social platform links */}
            {socials.map((s, i) => {
              const Icon  = ICON_MAP[s.platform] || FaYoutube;
              const color = BRAND_COLOR[s.platform];   // null = SVG has own colour
              return (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="biz-tile__social"
                  title={s.label}
                >
                  {color
                    ? <Icon size={24} color={color} />
                    : <Icon size={24} />
                  }
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo slideshow — full bleed, at bottom */}
      {gallery.length > 0 && (
        <div
          className="biz-slide"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            key={slideIdx}
            src={gallery[slideIdx].url}
            alt={gallery[slideIdx].caption || biz.name}
            className="biz-slide__img"
          />
          {gallery.length > 1 && (
            <div className="biz-slide__dots">
              {gallery.map((_, i) => (
                <button
                  key={i}
                  className={`biz-slide__dot${i === slideIdx ? ' active' : ''}`}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
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

      {/* ── Card ── */}
      <main className="dc__card">

        {/* Profile */}
        <motion.section
          className="dc-profile"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="dc-profile__av-ring">
            {owner?.photo
              ? <img src={owner.photo} alt={owner.name} className="dc-profile__av" />
              : <div className="dc-profile__av-ph"><FiCamera size={30} /></div>
            }
          </div>
          <h1 className="dc-profile__name">{owner?.name || 'Rahul Babariya'}</h1>
          <p className="dc-profile__title">{owner?.tagline || 'Photographer & Creative Director'}</p>
          {owner?.address && (
            <span className="dc-profile__loc">
              <FiMapPin size={10} /> {owner.address}
            </span>
          )}
        </motion.section>

        {/* Social quick-links — Instagram & YouTube only (official logos) */}
        {(igLink || ytLink) && (
          <motion.div
            className="dc-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {igLink && (
              <a href={igLink} target="_blank" rel="noopener noreferrer" className="dc-act dc-act--insta">
                <IgIcon size={22} /><span>Instagram</span>
              </a>
            )}
            {ytLink && (
              <a href={ytLink} target="_blank" rel="noopener noreferrer" className="dc-act dc-act--yt">
                <FaYoutube size={22} /><span>YouTube</span>
              </a>
            )}
          </motion.div>
        )}

        {/* Divider */}
        <div className="dc-divider" />

        {/* Business tiles */}
        <div className="dc-biz">
          {businesses?.aurpix && <BizTile biz={businesses.aurpix} delay={0.15} onContact={setBizContact} />}
          {businesses?.dada   && <BizTile biz={businesses.dada}   delay={0.25} onContact={setBizContact} />}
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
