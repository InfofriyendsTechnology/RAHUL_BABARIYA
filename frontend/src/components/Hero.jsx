import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMapPin, FiDownload, FiCamera } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import './Hero.scss';

const downloadVCard = (owner) => {
  const lines = [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${owner.name || 'Rahul Babariya'}`,
    `TITLE:${owner.tagline || 'Photographer'}`,
  ];
  if (owner.phone)    lines.push(`TEL;TYPE=CELL:+91${owner.phone}`);
  if (owner.whatsapp) lines.push(`TEL;TYPE=CELL:+${owner.whatsapp}`);
  if (owner.email)    lines.push(`EMAIL:${owner.email}`);
  if (owner.address)  lines.push(`ADR:;;${owner.address};;;;`);
  lines.push('END:VCARD');
  const blob = new Blob([lines.join('\n')], { type: 'text/vcard' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${(owner.name || 'Rahul_Babariya').replace(/\s+/g, '_')}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
};

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 28 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.6, delay, ease: [0.4, 0, 0.2, 1] },
});

const Hero = ({ owner }) => {
  const name    = owner?.name    || 'Rahul Babariya';
  const tagline = owner?.tagline || 'Photographer & Creative Director';
  const bio     = owner?.bio     || "Capturing life's most precious moments through the lens.";
  const photo   = owner?.photo;
  const address = owner?.address;

  return (
    <section className="hero" id="about">
      <div className="hero__bg" aria-hidden />

      <div className="container hero__inner">
        {/* Photo column */}
        <motion.div
          className="hero__photo-col"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="hero__avatar-ring">
            {photo ? (
              <img src={photo} alt={name} className="hero__avatar-img" />
            ) : (
              <div className="hero__avatar-ph">
                <FiCamera size={52} />
                <span>Add Photo</span>
              </div>
            )}
          </div>
          <div className="hero__years-badge">
            <span className="hero__years-num">7+</span>
            <span className="hero__years-txt">Years</span>
          </div>
        </motion.div>

        {/* Info column */}
        <div className="hero__info">
          <motion.span className="badge" {...fadeUp(0.1)}>
            <FiCamera size={12} /> Photographer
          </motion.span>

          <motion.h1 className="hero__name" {...fadeUp(0.16)}>
            {name.split(' ')[0]}<br />
            <span className="hero__name-accent">{name.split(' ').slice(1).join(' ')}</span>
          </motion.h1>

          <motion.p className="hero__tagline" {...fadeUp(0.22)}>
            {tagline}
          </motion.p>

          {address && (
            <motion.span className="hero__location" {...fadeUp(0.27)}>
              <FiMapPin size={13} /> {address}
            </motion.span>
          )}

          {bio && (
            <motion.p className="hero__bio" {...fadeUp(0.32)}>
              {bio}
            </motion.p>
          )}

          <motion.div className="hero__actions" {...fadeUp(0.4)}>
            {owner?.phone && (
              <a href={`tel:+91${owner.phone}`} className="hero__action hero__action--call">
                <FiPhone size={17} /><span>Call</span>
              </a>
            )}
            {owner?.whatsapp && (
              <a href={`https://wa.me/${owner.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="hero__action hero__action--wa">
                <FaWhatsapp size={17} /><span>WhatsApp</span>
              </a>
            )}
            {owner?.email && (
              <a href={`mailto:${owner.email}`} className="hero__action hero__action--mail">
                <FiMail size={17} /><span>Email</span>
              </a>
            )}
            <button className="hero__action hero__action--save" onClick={() => downloadVCard(owner || {})}>
              <FiDownload size={17} /><span>Save Contact</span>
            </button>
          </motion.div>

          <motion.div className="hero__biz-links" {...fadeUp(0.46)}>
            <a href="#aurpix" className="btn-primary">Aurpix Studio</a>
            <a href="#dada"   className="btn-outline">Dada Media</a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
