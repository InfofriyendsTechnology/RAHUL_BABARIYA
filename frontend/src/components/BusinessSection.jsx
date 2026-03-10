import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCamera, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import './BusinessSection.scss';

const ICON_MAP = { FaInstagram, FaFacebook, FaYoutube, FaWhatsapp };

// ── Photo Slider ────────────────────────────────────────────────────────────
const PhotoSlider = ({ images, onImageClick }) => {
  const [[current, dir], setSlide] = useState([0, 0]);
  const timerRef = useRef(null);

  const go = useCallback((idx, d) => setSlide([idx, d]), []);

  const next = useCallback(() => {
    setSlide(([cur]) => [(cur + 1) % images.length, 1]);
  }, [images.length]);

  const prev = useCallback(() => {
    setSlide(([cur]) => [(cur - 1 + images.length) % images.length, -1]);
  }, [images.length]);

  // Auto-play
  const startAuto = useCallback(() => {
    if (images.length < 2) return;
    timerRef.current = setInterval(next, 4500);
  }, [next, images.length]);

  const stopAuto = useCallback(() => clearInterval(timerRef.current), []);

  useEffect(() => {
    startAuto();
    return stopAuto;
  }, [startAuto, stopAuto]);

  // Touch swipe
  const touchX = useRef(0);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    const diff = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 48) diff > 0 ? next() : prev();
  };

  if (images.length === 0) {
    return (
      <div className="slider slider--empty">
        <FiCamera size={44} />
        <span>Photos will appear here once uploaded</span>
      </div>
    );
  }

  const variants = {
    enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
    center:       ({ x: 0, opacity: 1 }),
    exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div
      className="slider"
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="slider__track">
        <AnimatePresence custom={dir} initial={false}>
          <motion.div
            key={current}
            className="slider__slide"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            <img
              src={images[current].url}
              alt={images[current].caption || `Photo ${current + 1}`}
              loading="lazy"
              onClick={() => onImageClick && onImageClick(images[current])}
            />
            {images[current].caption && (
              <div className="slider__caption">{images[current].caption}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <>
          <button className="slider__btn slider__btn--prev" onClick={prev} aria-label="Previous photo">
            <FiChevronLeft size={22} />
          </button>
          <button className="slider__btn slider__btn--next" onClick={next} aria-label="Next photo">
            <FiChevronRight size={22} />
          </button>
          <div className="slider__dots">
            {images.map((_, i) => (
              <button
                key={i}
                className={`slider__dot${i === current ? ' active' : ''}`}
                onClick={() => go(i, i > current ? 1 : -1)}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
          <div className="slider__counter">
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
};

// ── Business Section ─────────────────────────────────────────────────────────
const BusinessSection = ({ id, business, accent }) => {
  const [lightbox, setLightbox] = useState(null);

  if (!business) return null;

  const { name, tagline, description, logo, gallery = [], services = [], socialLinks = [] } = business;
  const activeSocials = socialLinks.filter(s => s.url);

  return (
    <section className={`biz section biz--${id}`} id={id}>
      <div className="container">

        {/* ── Header ── */}
        <motion.div
          className="biz__head"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55 }}
        >
          <span className="badge">{accent || name}</span>
          <div className="biz__title-row">
            {logo && (
              <img src={logo} alt={`${name} logo`} className="biz__logo" />
            )}
            <div>
              <h2>{name}</h2>
              {tagline && <p className="biz__tagline">{tagline}</p>}
            </div>
          </div>
          {description && <p className="biz__desc">{description}</p>}
        </motion.div>

        {/* ── Photo Slider ── */}
        <motion.div
          className="biz__slider-wrap"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <PhotoSlider images={gallery} onImageClick={setLightbox} />
        </motion.div>

        {/* ── Services ── */}
        {services.length > 0 && (
          <div className="biz__services">
            <h3 className="biz__services-title">Our Services</h3>
            <div className="biz__services-grid">
              {services.map((s, i) => (
                <motion.div
                  key={i}
                  className="biz__service"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                >
                  <span className="biz__service-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="biz__service-body">
                    <h4>{s.name}</h4>
                    <p>{s.description}</p>
                  </div>
                  {s.price && <span className="biz__service-price">{s.price}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Per-business Social Links ── */}
        {activeSocials.length > 0 && (
          <motion.div
            className="biz__socials"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <p className="biz__socials-label">Follow {name}</p>
            <div className="biz__socials-row">
              {activeSocials.map((s, i) => {
                const Icon = ICON_MAP[s.icon] || FaInstagram;
                return (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="biz__social-link"
                    title={s.label}
                  >
                    <Icon size={20} />
                    <span>{s.label}</span>
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button className="lightbox__close" onClick={() => setLightbox(null)}>
              <FiX size={24} />
            </button>
            <motion.img
              src={lightbox.url}
              alt={lightbox.caption || ''}
              className="lightbox__img"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            />
            {lightbox.caption && (
              <p className="lightbox__caption" onClick={(e) => e.stopPropagation()}>
                {lightbox.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BusinessSection;
