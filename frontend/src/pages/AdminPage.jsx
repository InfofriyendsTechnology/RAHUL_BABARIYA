import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLock, FiEye, FiEyeOff, FiSave, FiUpload, FiTrash2, FiLogOut,
  FiX, FiSun, FiMoon, FiZoomIn, FiZoomOut, FiUser, FiCamera, FiFilm, FiLink, FiGlobe, FiEdit2,
  FiPhone, FiMail, FiMapPin, FiExternalLink,
} from 'react-icons/fi';
import {
  FaInstagram, FaFacebook, FaYoutube, FaWhatsapp, FaMapMarkerAlt, FaTelegram, FaTwitter,
  FaLinkedin, FaTiktok, FaSnapchat, FaPinterest,
  FaPhone, FaEnvelope, FaMapPin, FaGlobe as FaGlobeIcon,
  FaHome, FaBuilding, FaStore, FaBriefcase, FaShoppingCart, FaShoppingBag,
} from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { adminLogin, fetchPortfolio, updatePortfolio, uploadImage } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { getIconComponent, iconCategories } from '../utils/iconMapping';
import './AdminPage.scss';

// ── Crop canvas size ──────────────────────────────────────────────────────────
const CROP = 280;

// ── Social platform meta ──────────────────────────────────────────────────────
const SOCIAL_META = {
  instagram: { Icon: FaInstagram,    label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.12)',  placeholder: 'https://instagram.com/yourprofile' },
  facebook:  { Icon: FaFacebook,     label: 'Facebook',  color: '#1877F2', bg: 'rgba(24,119,242,0.12)', placeholder: 'https://facebook.com/yourpage'    },
  youtube:   { Icon: FaYoutube,      label: 'YouTube',   color: '#FF0000', bg: 'rgba(255,0,0,0.10)',    placeholder: 'https://youtube.com/@yourchannel' },
  whatsapp:  { Icon: FaWhatsapp,     label: 'WhatsApp',  color: '#25D366', bg: 'rgba(37,211,102,0.12)', placeholder: 'https://wa.me/91XXXXXXXXXX'       },
  maps:      { Icon: FaMapMarkerAlt, label: 'Maps',      color: '#34A853', bg: 'rgba(52,168,83,0.12)',  placeholder: 'https://maps.google.com/...'     },
  telegram:  { Icon: FaTelegram,     label: 'Telegram',  color: '#2AABEE', bg: 'rgba(42,171,238,0.12)', placeholder: 'https://t.me/yourusername'        },
  twitter:   { Icon: FaTwitter,      label: 'Twitter',   color: '#1DA1F2', bg: 'rgba(29,161,242,0.12)', placeholder: 'https://twitter.com/yourhandle'  },
  website:   { Icon: FiGlobe,        label: 'Website',   color: '#B68973', bg: 'rgba(182,137,115,0.12)', placeholder: 'https://yourwebsite.com'         },
};
// Map old platform keys → new iconName (backward compat)
const PLATFORM_TO_ICON = {
  instagram: 'FaInstagram', facebook: 'FaFacebook', youtube: 'FaYoutube',
  whatsapp: 'FaWhatsapp', maps: 'FaMapMarkerAlt', telegram: 'FaTelegram',
  twitter: 'FaTwitter', website: 'FaGlobe',
};

const inferIconFromUrl = (rawUrl = '') => {
  const u = rawUrl.toLowerCase();
  if (u.includes('instagram.com')) return 'FaInstagram';
  if (u.includes('facebook.com') || u.includes('fb.com')) return 'FaFacebook';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'FaYoutube';
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return 'FaWhatsapp';
  if (u.includes('maps.google.') || u.includes('google.com/maps') || u.includes('map')) return 'FaMapMarkerAlt';
  if (u.includes('t.me') || u.includes('telegram.me') || u.includes('telegram.org')) return 'FaTelegram';
  if (u.includes('linkedin.com')) return 'FaLinkedin';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'FaTwitter';
  if (u.includes('tiktok.com')) return 'FaTiktok';
  if (u.includes('snapchat.com')) return 'FaSnapchat';
  if (u.includes('pinterest.com')) return 'FaPinterest';
  return 'FaLink';
};

const inferPlatformFromUrlOrLabel = (rawUrl = '', rawLabel = '') => {
  const u = rawUrl.toLowerCase();
  const l = rawLabel.toLowerCase();
  if (u.includes('instagram.com') || l.includes('instagram')) return 'instagram';
  if (u.includes('facebook.com') || u.includes('fb.com') || l.includes('facebook')) return 'facebook';
  if (u.includes('youtube.com') || u.includes('youtu.be') || l.includes('youtube')) return 'youtube';
  if (u.includes('wa.me') || u.includes('whatsapp.com') || l.includes('whatsapp')) return 'whatsapp';
  if (u.includes('maps.google.') || u.includes('google.com/maps') || l.includes('map') || l.includes('address') || l.includes('location')) return 'maps';
  if (u.includes('t.me') || u.includes('telegram.me') || u.includes('telegram.org') || l.includes('telegram')) return 'telegram';
  if (u.includes('twitter.com') || u.includes('x.com') || l.includes('twitter') || l === 'x') return 'twitter';
  if (u.includes('linkedin.com') || l.includes('linkedin')) return 'linkedin';
  if (u.includes('tiktok.com') || l.includes('tiktok')) return 'tiktok';
  if (u.includes('snapchat.com') || l.includes('snapchat')) return 'snapchat';
  if (u.includes('pinterest.com') || l.includes('pinterest')) return 'pinterest';
  return 'website';
};

// ── Image Adjust Modal ────────────────────────────────────────────────────────
const ImageAdjustModal = ({ file, onConfirm, onCancel }) => {
  const canvasRef  = useRef(null);
  const imgRef     = useRef(null);
  const dragRef    = useRef(null);
  const [scale,    setScale]    = useState(1);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [ready,    setReady]    = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; setReady(true); };
    const url = URL.createObjectURL(file);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx  = canvas.getContext('2d');
    const S    = CROP;
    ctx.clearRect(0, 0, S, S);
    const base = Math.max(S / img.width, S / img.height);
    const s    = base * scale;
    const w    = img.width  * s;
    const h    = img.height * s;
    const x    = (S - w) / 2 + offset.x;
    const y    = (S - h) / 2 + offset.y;
    ctx.globalAlpha = 0.28;
    ctx.drawImage(img, x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2 - 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }, [scale, offset, ready]);

  useEffect(() => { if (ready) draw(); }, [draw]);

  const onPD = (e) => {
    setDragging(true);
    dragRef.current = { bx: e.clientX - offset.x, by: e.clientY - offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPM = (e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragRef.current.bx, y: e.clientY - dragRef.current.by });
  };
  const onPU = () => setDragging(false);

  const handleConfirm = () => {
    const out  = document.createElement('canvas');
    out.width  = CROP;
    out.height = CROP;
    const ctx  = out.getContext('2d');
    const img  = imgRef.current;
    const S    = CROP;
    const base = Math.max(S / img.width, S / img.height);
    const s    = base * scale;
    const w    = img.width  * s;
    const h    = img.height * s;
    const x    = (S - w) / 2 + offset.x;
    const y    = (S - h) / 2 + offset.y;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    out.toBlob(
      blob => onConfirm(new File([blob], file.name.replace(/\.\w+$/, '.png'), { type: 'image/png' })),
      'image/png', 0.92
    );
  };

  return (
    <div className="ia-overlay" onClick={onCancel}>
      <motion.div
        className="ia-modal"
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ia-modal__top">
          <h3 className="ia-modal__title">Adjust Photo</h3>
          <button className="ia-modal__close" onClick={onCancel}><FiX size={18} /></button>
        </div>
        <p className="ia-modal__hint">Drag to reposition · Zoom to resize</p>
        <div className="ia-modal__canvas-wrap">
          {!ready && <div className="ia-modal__loading"><div className="adm-spin" /></div>}
          <canvas
            ref={canvasRef}
            width={CROP}
            height={CROP}
            className="ia-modal__canvas"
            onPointerDown={onPD}
            onPointerMove={onPM}
            onPointerUp={onPU}
            onPointerCancel={onPU}
            style={{ cursor: dragging ? 'grabbing' : 'grab', display: ready ? 'block' : 'none' }}
          />
        </div>
        <div className="ia-modal__zoom">
          <FiZoomOut size={16} />
          <input
            type="range" min="0.5" max="3" step="0.01" value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            className="ia-modal__slider"
          />
          <FiZoomIn size={16} />
        </div>
        <div className="ia-modal__actions">
          <button className="ia-btn ia-btn--cancel"  onClick={onCancel}>Cancel</button>
          <button className="ia-btn ia-btn--confirm" onClick={handleConfirm} disabled={!ready}>Use Photo</button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Password Gate ─────────────────────────────────────────────────────────────
const PasswordGate = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res   = await adminLogin(password);
      const token = res.data?.data?.token;
      if (token) { localStorage.setItem('rb-admin-token', token); onSuccess(); }
    } catch { setError('Invalid password. Please try again.'); }
    finally   { setLoading(false); }
  };

  return (
    <div className="admin-gate">
      <motion.div
        className="admin-gate__card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="admin-gate__icon"><FiLock size={32} /></div>
        <h2>Admin Access</h2>
        <p>Enter your password to manage portfolio content</p>
        <form onSubmit={handleSubmit} className="admin-gate__form">
          <div className="admin-gate__input-wrap">
            <input
              type={show ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required autoFocus
            />
            <button type="button" onClick={() => setShow(v => !v)} className="admin-gate__eye">
              {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {error && <p className="admin-gate__error">{error}</p>}
          <button type="submit" className="admin-gate__submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Access Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ── Image Uploader (opens adjust modal before uploading) ──────────────────────
const ImageUploader = ({ label, folder, onUpload }) => {
  const [pendingFile, setPendingFile] = useState(null);
  const [uploading,   setUploading]   = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = '';
  };

  const handleConfirm = async (croppedFile) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const res = await uploadImage(croppedFile, folder);
      onUpload(res.data?.data?.url);
    } catch { alert('Upload failed. Please try again.'); }
    finally   { setUploading(false); }
  };

  return (
    <>
      <label className={`img-uploader${uploading ? ' img-uploader--busy' : ''}`}>
        <FiUpload size={14} />
        <span>{uploading ? 'Uploading…' : label}</span>
        <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
      </label>
      <AnimatePresence>
        {pendingFile && (
          <ImageAdjustModal
            file={pendingFile}
            onConfirm={handleConfirm}
            onCancel={() => setPendingFile(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ── Admin Icon Picker ─────────────────────────────────────────────────────────
const AdminIconPicker = ({ selectedIcon, onSelectIcon, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Social Media');
  const [searchQuery,    setSearchQuery]    = useState('');

  const getFilteredIcons = () => {
    if (!searchQuery) return iconCategories[activeCategory] || [];
    const all = Object.values(iconCategories).flat();
    return all.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };
  const filtered = getFilteredIcons();

  return (
    <div className="icon-picker-overlay" onClick={onClose}>
      <div className="icon-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="icon-picker-header">
          <h3>Select Icon</h3>
          <button className="ia-modal__close" onClick={onClose}><FiX size={16} /></button>
        </div>
        <div className="icon-picker-search">
          <input
            type="text" placeholder="Search icons…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
        {!searchQuery && (
          <div className="icon-picker-categories">
            {Object.keys(iconCategories).map(cat => (
              <button
                key={cat}
                className={`icon-picker-cat-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >{cat}</button>
            ))}
          </div>
        )}
        <div className="icon-picker-grid">
          {filtered.length > 0 ? filtered.map(iconData => {
            const IC = getIconComponent(iconData.icon);
            return (
              <button
                key={iconData.icon}
                className={`icon-option${selectedIcon === iconData.icon ? ' selected' : ''}`}
                onClick={() => { onSelectIcon(iconData.icon); onClose(); }}
                title={iconData.name}
              >
                <IC size={22} />
                <span>{iconData.name}</span>
              </button>
            );
          }) : <div className="icon-picker-empty">No icons found</div>}
        </div>
      </div>
    </div>
  );
};

// ── Link Edit Modal ────────────────────────────────────────────────────────────
const LinkEditModal = ({ link, onSave, onCancel }) => {
  const [iconType,      setIconType]      = useState(link?.iconType || 'default');
  const [iconName,      setIconName]      = useState(() => {
    if (link?.iconName) return link.iconName;
    if (link?.icon) return link.icon;
    if (link?.platform) return PLATFORM_TO_ICON[link.platform] || 'FaLink';
    if (link?.url) return inferIconFromUrl(link.url);
    return 'FaLink';
  });
  const [customIconUrl, setCustomIconUrl] = useState(link?.customIconUrl || null);
  const [label,         setLabel]         = useState(link?.label || '');
  const [url,           setUrl]           = useState(link?.url   || '');
  const [showPicker,    setShowPicker]    = useState(false);
  const [uploading,     setUploading]     = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file, 'rahul-babariya/icons');
      setIconType('uploaded');
      setCustomIconUrl(res.data?.data?.url);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Icon upload failed. Please try again.';
      alert(msg);
    }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleSave = () => {
    if (!url.trim()) { alert('URL is required'); return; }
    const cleanUrl = url.trim();
    const cleanLabel = label.trim() || 'My Link';
    const finalIconName = iconType === 'default'
      ? (iconName === 'FaLink' ? inferIconFromUrl(cleanUrl) : iconName)
      : iconName;
    const finalPlatform = link?.platform || inferPlatformFromUrlOrLabel(cleanUrl, cleanLabel);
    onSave({
      platform: finalPlatform,
      iconType,
      iconName: finalIconName,
      icon: finalIconName, // legacy compatibility
      customIconUrl,
      label: cleanLabel,
      url: cleanUrl,
    });
  };

  const IconComp = getIconComponent(iconName);

  return (
    <div className="ia-overlay" onClick={onCancel}>
      <motion.div
        className="ia-modal lm-modal"
        initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="ia-modal__top">
          <h3 className="ia-modal__title">{link ? 'Edit Link' : 'Add Link'}</h3>
          <button className="ia-modal__close" onClick={onCancel}><FiX size={18} /></button>
        </div>

        {/* ── Icon ── */}
        <div className="lm-icon-row">
          <div className="lm-icon-preview">
            {iconType === 'uploaded' && customIconUrl
              ? <img src={customIconUrl} alt="icon" />
              : <IconComp size={28} />
            }
          </div>
          <div className="lm-icon-btns">
            <button type="button" className="lm-btn-sec" onClick={() => setShowPicker(true)}>
              Choose Icon
            </button>
            <label className={`lm-btn-sec lm-upload-label${uploading ? ' lm-btn-sec--busy' : ''}`}>
              {uploading ? 'Uploading…' : 'Upload Custom'}
              <input type="file" accept="image/*" hidden onChange={handleUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* ── Name ── */}
        <div className="field">
          <label>Link Name</label>
          <input
            value={label} onChange={e => setLabel(e.target.value)}
            placeholder="e.g. Instagram, My Website, Portfolio…"
          />
        </div>

        {/* ── URL ── */}
        <div className="field">
          <label>URL *</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
        </div>

        <div className="ia-modal__actions">
          <button className="ia-btn ia-btn--cancel"  onClick={onCancel}>Cancel</button>
          <button className="ia-btn ia-btn--confirm" onClick={handleSave}>{link ? 'Update' : 'Add Link'}</button>
        </div>
      </motion.div>

      {showPicker && (
        <AdminIconPicker
          selectedIcon={iconName}
          onSelectIcon={(name) => {
            setIconType('default');
            setIconName(name);
            setCustomIconUrl(null);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

// ── Social Links Manager (card list + modal, like NFC Wala) ─────────────────
const SocialLinksManager = ({ links = [], onChange }) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [showAdd,    setShowAdd]    = useState(false);
  const add    = (d) => { onChange([...links, d]);                               setShowAdd(false);   };
  const update = (i, d) => { const n = [...links]; n[i] = d; onChange(n);        setEditingIdx(null); };
  const remove = (i) => onChange(links.filter((_, idx) => idx !== i));
  return (
    <div className="slm">
      {links.map((s, i) => {
        const meta = SOCIAL_META[s.platform] || { Icon: FiGlobe, color: '#B68973', bg: 'rgba(182,137,115,0.12)' };
        const SlcIcon = () => {
          if (s.iconType === 'uploaded' && s.customIconUrl)
            return <img src={s.customIconUrl} alt={s.label} style={{ width: 20, height: 20, objectFit: 'contain' }} />;
          if (s.iconName || s.icon) { const IC = getIconComponent(s.iconName || s.icon); return <IC size={20} />; }
          return <meta.Icon size={20} />;
        };
        return (
          <div key={i} className="slc">
            <div className="slc__icon" style={{ background: meta.bg, color: meta.color }}><SlcIcon /></div>
            <div className="slc__info">
              <span className="slc__name">{s.label || meta.label || 'My Link'}</span>
              <span className="slc__url">{s.url || <em>No URL set</em>}</span>
            </div>
            <div className="slc__btns">
              <button type="button" className="slc__btn"        onClick={() => setEditingIdx(i)}><FiEdit2  size={14} /></button>
              <button type="button" className="slc__btn slc__btn--del" onClick={() => remove(i)}><FiTrash2 size={14} /></button>
            </div>
          </div>
        );
      })}
      <button type="button" className="slc__add" onClick={() => setShowAdd(true)}>+ Add Link</button>
      <AnimatePresence>
        {showAdd && <LinkEditModal onSave={add} onCancel={() => setShowAdd(false)} />}
        {editingIdx !== null && (
          <LinkEditModal key={editingIdx} link={links[editingIdx]}
            onSave={d => update(editingIdx, d)} onCancel={() => setEditingIdx(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Gallery Manager ────────────────────────────────────────────────────────────
const GalleryManager = ({ gallery = [], folder, onChange }) => {
  const add        = (url) => onChange([...gallery, { url, caption: '' }]);
  const remove     = (i)   => onChange(gallery.filter((_, idx) => idx !== i));
  const setCaption = (i, caption) => {
    const next = [...gallery]; next[i] = { ...next[i], caption }; onChange(next);
  };
  return (
    <div className="gallery-mgr">
      <div className="gallery-mgr__grid">
        {gallery.map((img, i) => (
          <div key={i} className="gallery-mgr__item">
            <img src={img.url} alt={img.caption || ''} />
            <input type="text" placeholder="Caption" value={img.caption || ''} onChange={e => setCaption(i, e.target.value)} />
            <button className="gallery-mgr__remove" onClick={() => remove(i)}><FiTrash2 size={14} /></button>
          </div>
        ))}
      </div>
      <ImageUploader label="Add Image" folder={folder} onUpload={add} />
    </div>
  );
};

// ── Business Form (shared for Aurpix & Dada) ─────────────────────────────────
const BizForm = ({ biz, onChange, logoFolder, galleryFolder }) => (
  <div className="dash-tab-content">
    <div className="form-card">
      <div className="form-card__title">Business Logo</div>
      <div className="form-card__logo-area">
        {biz?.logo
          ? (
            <div className="form-card__logo-preview">
              <img src={biz.logo} alt="Logo" />
              <button className="form-card__logo-remove" onClick={() => onChange('logo', '')}><FiX size={13} /></button>
            </div>
          )
          : <div className="form-card__logo-ph"><FiCamera size={22} /></div>
        }
        <ImageUploader label="Upload Logo" folder={logoFolder} onUpload={url => onChange('logo', url)} />
      </div>
    </div>
    <div className="form-card">
      <div className="form-card__title">Business Info</div>
      <div className="form-card__fields">
        <div className="field">
          <label>Business Name</label>
          <input value={biz?.name || ''} onChange={e => onChange('name', e.target.value)} />
        </div>
        <div className="field">
          <label>Tagline</label>
          <input value={biz?.tagline || ''} onChange={e => onChange('tagline', e.target.value)} />
        </div>
        <div className="field field--full">
          <label>Description</label>
          <textarea rows={3} value={biz?.description || ''} onChange={e => onChange('description', e.target.value)} />
        </div>
      </div>
    </div>
    <div className="form-card">
      <div className="form-card__title">Business Contact</div>
      <div className="form-card__fields">
        <div className="field field--full">
          <label>Address</label>
          <input value={biz?.address || ''} onChange={e => onChange('address', e.target.value)} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={biz?.phone || ''} onChange={e => onChange('phone', e.target.value)} />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={biz?.email || ''} onChange={e => onChange('email', e.target.value)} />
        </div>
      </div>
    </div>
    <div className="form-card">
      <div className="form-card__title">Business Social Links</div>
      <SocialLinksManager links={biz?.socialLinks || []} onChange={links => onChange('socialLinks', links)} />
    </div>
    <div className="form-card">
      <div className="form-card__title">Gallery</div>
      <GalleryManager gallery={biz?.gallery || []} folder={galleryFolder} onChange={g => onChange('gallery', g)} />
    </div>
  </div>
);

// ── Tab config ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'owner',  label: 'Owner',  Icon: FiUser   },
  { key: 'aurpix', label: 'Aurpix', Icon: FiCamera },
  { key: 'dada',   label: 'Dada',   Icon: FiFilm   },
];

// ── Dashboard ───────────────────────────────────────────────────────────────────
const Dashboard = ({ onLogout }) => {
  const [data,          setData]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [tab,           setTab]           = useState('owner');
  const [toast,         setToast]         = useState('');
  const [headerPending, setHeaderPending] = useState(null);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    fetchPortfolio()
      .then(res => setData(res.data?.data))
      .catch(() => alert('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const save = async () => {
    setSaving(true);
    try   { await updatePortfolio(data); showToast('✅ Saved successfully!'); }
    catch { showToast('❌ Save failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const set = (path, value) => {
    const keys = path.split('.');
    setData(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  if (loading) return <div className="admin-loading"><div className="adm-spin" /></div>;

  const initials  = (data?.owner?.name || 'RB').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarSrc = data?.owner?.photo || '';

  const handleHeaderConfirm = async (croppedFile) => {
    setHeaderPending(null);
    try {
      const res = await uploadImage(croppedFile, 'rahul-babariya/owner');
      set('owner.photo', res.data?.data?.url);
      showToast('✅ Photo updated!');
    } catch { showToast('❌ Upload failed.'); }
  };

  return (
    <div className="admin-dash">

      {/* Header */}
      <div className="admin-dash__header">
        <div className="admin-dash__brand">
          <label className="admin-dash__avatar-wrap" title="Change photo">
            {avatarSrc
              ? <img src={avatarSrc} alt={initials} className="admin-dash__avatar" />
              : <div className="admin-dash__avatar-ph">{initials}</div>
            }
            <span className="admin-dash__avatar-overlay"><FiUpload size={12} /></span>
            <input
              type="file" accept="image/*" hidden
              onChange={e => { const f = e.target.files[0]; if (f) { setHeaderPending(f); e.target.value = ''; } }}
            />
          </label>
          <div className="admin-dash__brand-info">
            <span className="admin-dash__brand-name">{data?.owner?.name || 'Rahul Babariya'}</span>
            <span className="admin-dash__brand-role">Admin Panel</span>
          </div>
        </div>
        <div className="admin-dash__actions">
          <button className="admin-dash__save" onClick={save} disabled={saving} title={saving ? 'Saving…' : 'Save'}>
            <FiSave size={17} />
          </button>
          <button className="admin-dash__icon-btn" onClick={toggleTheme}>
            {isDark ? <FiSun size={17} /> : <FiMoon size={17} />}
          </button>
          <button className="admin-dash__icon-btn admin-dash__icon-btn--danger" onClick={onLogout}>
            <FiLogOut size={17} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-dash__tabs">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} className={`admin-dash__tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
            <Icon size={17} /><span>{label}</span>
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="admin-dash__body">

        {tab === 'owner' && data && (
          <div className="dash-tab-content">
            <div className="form-card">
              <div className="form-card__title">Profile Photo</div>
              <div className="form-card__photo-center">
                <div className="form-card__photo-ring">
                  {data.owner?.photo
                    ? <img src={data.owner.photo} alt="Owner" />
                    : <div className="form-card__photo-ph"><FiCamera size={26} /></div>
                  }
                </div>
                <div className="form-card__photo-actions">
                  <ImageUploader label="Change Photo" folder="rahul-babariya/owner" onUpload={url => set('owner.photo', url)} />
                  {data.owner?.photo && (
                    <button className="form-card__photo-remove" onClick={() => set('owner.photo', '')}>
                      <FiTrash2 size={13} /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="form-card">
              <div className="form-card__title">Basic Info</div>
              <div className="form-card__fields">
                <div className="field"><label>Name</label>
                  <input value={data.owner?.name || ''} onChange={e => set('owner.name', e.target.value)} />
                </div>
                <div className="field"><label>Tagline</label>
                  <input value={data.owner?.tagline || ''} onChange={e => set('owner.tagline', e.target.value)} />
                </div>
                <div className="field field--full"><label>Bio</label>
                  <textarea rows={3} value={data.owner?.bio || ''} onChange={e => set('owner.bio', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="form-card">
              <div className="form-card__title">Contact</div>
              <div className="form-card__fields">
                <div className="field"><label>Phone</label>
                  <input value={data.owner?.phone || ''} onChange={e => set('owner.phone', e.target.value)} placeholder="91XXXXXXXXXX" />
                </div>
                <div className="field"><label>WhatsApp</label>
                  <input value={data.owner?.whatsapp || ''} onChange={e => set('owner.whatsapp', e.target.value)} placeholder="91XXXXXXXXXX" />
                </div>
                <div className="field"><label>Email</label>
                  <input value={data.owner?.email || ''} onChange={e => set('owner.email', e.target.value)} />
                </div>
                <div className="field field--full"><label>Address</label>
                  <input value={data.owner?.address || ''} onChange={e => set('owner.address', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="form-card">
              <div className="form-card__title">Personal Social Links</div>
              <SocialLinksManager
                links={data.socialLinks || []}
                onChange={links => setData(prev => ({ ...prev, socialLinks: links }))}
              />
            </div>
          </div>
        )}

        {tab === 'aurpix' && data && (
          <BizForm
            biz={data.businesses?.aurpix}
            onChange={(field, val) => set(`businesses.aurpix.${field}`, val)}
            logoFolder="rahul-babariya/logos"
            galleryFolder="rahul-babariya/aurpix"
          />
        )}

        {tab === 'dada' && data && (
          <BizForm
            biz={data.businesses?.dada}
            onChange={(field, val) => set(`businesses.dada.${field}`, val)}
            logoFolder="rahul-babariya/logos"
            galleryFolder="rahul-babariya/dada"
          />
        )}


      </div>

      {/* Header avatar adjust modal */}
      <AnimatePresence>
        {headerPending && (
          <ImageAdjustModal
            file={headerPending}
            onConfirm={handleHeaderConfirm}
            onCancel={() => setHeaderPending(null)}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="admin-toast"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── AdminPage Root ─────────────────────────────────────────────────────────────────
const AdminPage = () => {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('rb-admin-token'));
  const logout = () => { localStorage.removeItem('rb-admin-token'); setAuthed(false); };
  return authed
    ? <Dashboard onLogout={logout} />
    : <PasswordGate onSuccess={() => setAuthed(true)} />;
};

export default AdminPage;
