import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiSave, FiUpload, FiTrash2, FiLogOut, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { adminLogin, fetchPortfolio, updatePortfolio, uploadImage } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import './AdminPage.scss';

// ── Password Gate ───────────────────────────────────────────────────────────
const PasswordGate = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminLogin(password);
      const token = res.data?.data?.token;
      if (token) {
        localStorage.setItem('rb-admin-token', token);
        onSuccess();
      }
    } catch {
      setError('Invalid password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-gate">
      <motion.div
        className="admin-gate__card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.5 }}
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
              required
              autoFocus
            />
            <button type="button" onClick={() => setShow(v => !v)} className="admin-gate__eye">
              {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          {error && <p className="admin-gate__error">{error}</p>}
          <button type="submit" className="btn-primary btn-lg admin-gate__submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ── Image Uploader ──────────────────────────────────────────────────────────
const ImageUploader = ({ label, folder, onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file, folder);
      onUpload(res.data?.data?.url);
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <label className="img-uploader">
      <FiUpload size={16} />
      <span>{uploading ? 'Uploading...' : label}</span>
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} hidden />
    </label>
  );
};

// ── Business Social Links Editor ────────────────────────────────────────────
const BIZ_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube'   },
  { value: 'facebook',  label: 'Facebook'  },
  { value: 'maps',      label: 'Maps'      },
  { value: 'website',   label: 'Website'   },
];

const BizSocialEditor = ({ links = [], onChange }) => {
  const add = () => onChange([
    ...links,
    { platform: 'instagram', label: 'Instagram', url: '', icon: 'FaInstagram' },
  ]);
  const remove = (i) => onChange(links.filter((_, idx) => idx !== i));
  const update = (i, field, value) => {
    const next = [...links];
    if (field === 'platform') {
      const p = BIZ_PLATFORMS.find(p => p.value === value);
      next[i] = { ...next[i], platform: value, label: p?.label || value };
    } else {
      next[i] = { ...next[i], [field]: value };
    }
    onChange(next);
  };

  return (
    <div className="biz-social-editor">
      {links.map((s, i) => (
        <div key={i} className="biz-social-editor__row">
          <select
            value={s.platform || 'instagram'}
            onChange={e => update(i, 'platform', e.target.value)}
          >
            {BIZ_PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <input
            type="url"
            placeholder="https://..."
            value={s.url || ''}
            onChange={e => update(i, 'url', e.target.value)}
          />
          <button
            type="button"
            className="biz-social-editor__del"
            onClick={() => remove(i)}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="biz-social-editor__add" onClick={add}>
        + Add Social Link
      </button>
    </div>
  );
};

// ── Gallery Manager ─────────────────────────────────────────────────────────
const GalleryManager = ({ gallery = [], folder, onChange }) => {
  const add = (url) => onChange([...gallery, { url, caption: '' }]);
  const remove = (i) => onChange(gallery.filter((_, idx) => idx !== i));
  const setCaption = (i, caption) => {
    const next = [...gallery];
    next[i] = { ...next[i], caption };
    onChange(next);
  };

  return (
    <div className="gallery-mgr">
      <div className="gallery-mgr__grid">
        {gallery.map((img, i) => (
          <div key={i} className="gallery-mgr__item">
            <img src={img.url} alt={img.caption || ''} />
            <input
              type="text"
              placeholder="Caption (optional)"
              value={img.caption || ''}
              onChange={e => setCaption(i, e.target.value)}
            />
            <button className="gallery-mgr__remove" onClick={() => remove(i)}>
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      <ImageUploader label="Add Gallery Image" folder={folder} onUpload={add} />
    </div>
  );
};

// ── Dashboard ───────────────────────────────────────────────────────────────
const Dashboard = ({ onLogout }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState('owner');
  const [toast,   setToast]   = useState('');
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    fetchPortfolio()
      .then(res => setData(res.data?.data))
      .catch(() => alert('Failed to load portfolio data'))
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updatePortfolio(data);
      showToast('✅ Changes saved successfully!');
    } catch {
      showToast('❌ Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
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

  if (loading) return <div className="admin-loading"><div className="page-loader__spinner" /></div>;

  const TABS = [
    { key: 'owner',  label: 'Owner Info'    },
    { key: 'aurpix', label: 'Aurpix Studio' },
    { key: 'dada',   label: 'Dada Media'    },
    { key: 'social', label: 'Social Links'  },
  ];

  const initials = (data?.owner?.name || 'RB')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarSrc = data?.owner?.photo || '';

  return (
    <div className="admin-dash">
      {/* Header */}
      <div className="admin-dash__header">
        <div className="admin-dash__brand">
          <label className="admin-dash__avatar-wrap" title="Click to change photo">
            <img src={avatarSrc} alt={initials} className="admin-dash__avatar" />
            <span className="admin-dash__avatar-overlay"><FiUpload size={14} /></span>
            <input
              type="file" accept="image/*" hidden
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                  const res = await uploadImage(file, 'rahul-babariya/owner');
                  set('owner.photo', res.data?.data?.url);
                  showToast('✅ Photo updated!');
                } catch { showToast('❌ Upload failed.'); }
                e.target.value = '';
              }}
            />
          </label>
          <div className="admin-dash__brand-info">
            <span className="admin-dash__brand-name">{data?.owner?.name || 'Rahul Babariya'}</span>
            <span className="admin-dash__brand-role">Admin Panel</span>
          </div>
        </div>
        <div className="admin-dash__header-actions">
          <button className="btn-primary" onClick={save} disabled={saving}>
            <FiSave size={16} />{saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button className="admin-dash__theme-toggle" onClick={toggleTheme} title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
            {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <button className="admin-dash__logout" onClick={onLogout} title="Logout">
            <FiLogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-dash__tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`admin-dash__tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-dash__content">
        {/* Owner Tab */}
        {tab === 'owner' && data && (
          <div className="admin-form">
            <h3>Owner Information</h3>
            <div className="admin-form__grid">
              <label>Name
                <input value={data.owner?.name || ''} onChange={e => set('owner.name', e.target.value)} />
              </label>
              <label>Tagline
                <input value={data.owner?.tagline || ''} onChange={e => set('owner.tagline', e.target.value)} />
              </label>
              <label className="admin-form__full">Bio
                <textarea rows={4} value={data.owner?.bio || ''} onChange={e => set('owner.bio', e.target.value)} />
              </label>
              <label>Phone
                <input value={data.owner?.phone || ''} onChange={e => set('owner.phone', e.target.value)} placeholder="91XXXXXXXXXX" />
              </label>
              <label>WhatsApp
                <input value={data.owner?.whatsapp || ''} onChange={e => set('owner.whatsapp', e.target.value)} placeholder="91XXXXXXXXXX" />
              </label>
              <label>Email
                <input value={data.owner?.email || ''} onChange={e => set('owner.email', e.target.value)} />
              </label>
              <label className="admin-form__full">Address
                <input value={data.owner?.address || ''} onChange={e => set('owner.address', e.target.value)} />
              </label>
            </div>
            <div className="admin-form__photo">
              <label>Profile Photo</label>
              {data.owner?.photo && (
                <div className="admin-form__photo-preview">
                  <img src={data.owner.photo} alt="Owner" />
                  <button onClick={() => set('owner.photo', '')}><FiX size={16} /></button>
                </div>
              )}
              <ImageUploader label="Upload Photo" folder="rahul-babariya/owner" onUpload={url => set('owner.photo', url)} />
            </div>
          </div>
        )}

        {/* Aurpix Tab */}
        {tab === 'aurpix' && data && (
          <div className="admin-form">
            <h3>Aurpix Studio</h3>
            <div className="admin-form__logo-row">
              {data.businesses?.aurpix?.logo && (
                <div className="admin-form__logo-preview">
                  <img src={data.businesses.aurpix.logo} alt="Aurpix logo" />
                  <button onClick={() => set('businesses.aurpix.logo', '')}><FiX size={14} /></button>
                </div>
              )}
              <ImageUploader label="Upload Logo" folder="rahul-babariya/logos" onUpload={url => set('businesses.aurpix.logo', url)} />
            </div>
            <div className="admin-form__grid">
              <label>Business Name
                <input value={data.businesses?.aurpix?.name || ''} onChange={e => set('businesses.aurpix.name', e.target.value)} />
              </label>
              <label>Tagline
                <input value={data.businesses?.aurpix?.tagline || ''} onChange={e => set('businesses.aurpix.tagline', e.target.value)} />
              </label>
              <label className="admin-form__full">Description
                <textarea rows={4} value={data.businesses?.aurpix?.description || ''} onChange={e => set('businesses.aurpix.description', e.target.value)} />
              </label>
            </div>
            <h4>Contact Info</h4>
            <div className="admin-form__grid">
              <label className="admin-form__full">Address
                <input value={data.businesses?.aurpix?.address || ''} onChange={e => set('businesses.aurpix.address', e.target.value)} />
              </label>
              <label>Phone
                <input value={data.businesses?.aurpix?.phone || ''} onChange={e => set('businesses.aurpix.phone', e.target.value)} placeholder="07574026740" />
              </label>
              <label>Email
                <input value={data.businesses?.aurpix?.email || ''} onChange={e => set('businesses.aurpix.email', e.target.value)} />
              </label>
            </div>
            <h4>Social Links</h4>
            <BizSocialEditor
              links={data.businesses?.aurpix?.socialLinks || []}
              onChange={links => set('businesses.aurpix.socialLinks', links)}
            />
            <h4>Gallery</h4>
            <GalleryManager
              gallery={data.businesses?.aurpix?.gallery || []}
              folder="rahul-babariya/aurpix"
              onChange={g => set('businesses.aurpix.gallery', g)}
            />
          </div>
        )}

        {/* Dada Tab */}
        {tab === 'dada' && data && (
          <div className="admin-form">
            <h3>Dada Media</h3>
            <div className="admin-form__logo-row">
              {data.businesses?.dada?.logo && (
                <div className="admin-form__logo-preview">
                  <img src={data.businesses.dada.logo} alt="Dada Media logo" />
                  <button onClick={() => set('businesses.dada.logo', '')}><FiX size={14} /></button>
                </div>
              )}
              <ImageUploader label="Upload Logo" folder="rahul-babariya/logos" onUpload={url => set('businesses.dada.logo', url)} />
            </div>
            <div className="admin-form__grid">
              <label>Business Name
                <input value={data.businesses?.dada?.name || ''} onChange={e => set('businesses.dada.name', e.target.value)} />
              </label>
              <label>Tagline
                <input value={data.businesses?.dada?.tagline || ''} onChange={e => set('businesses.dada.tagline', e.target.value)} />
              </label>
              <label className="admin-form__full">Description
                <textarea rows={4} value={data.businesses?.dada?.description || ''} onChange={e => set('businesses.dada.description', e.target.value)} />
              </label>
            </div>
            <h4>Contact Info</h4>
            <div className="admin-form__grid">
              <label className="admin-form__full">Address
                <input value={data.businesses?.dada?.address || ''} onChange={e => set('businesses.dada.address', e.target.value)} />
              </label>
              <label>Phone
                <input value={data.businesses?.dada?.phone || ''} onChange={e => set('businesses.dada.phone', e.target.value)} placeholder="9375757594" />
              </label>
              <label>Email
                <input value={data.businesses?.dada?.email || ''} onChange={e => set('businesses.dada.email', e.target.value)} />
              </label>
            </div>
            <h4>Social Links</h4>
            <BizSocialEditor
              links={data.businesses?.dada?.socialLinks || []}
              onChange={links => set('businesses.dada.socialLinks', links)}
            />
            <h4>Gallery</h4>
            <GalleryManager
              gallery={data.businesses?.dada?.gallery || []}
              folder="rahul-babariya/dada"
              onChange={g => set('businesses.dada.gallery', g)}
            />
          </div>
        )}

        {/* Social Links Tab */}
        {tab === 'social' && data && (
          <div className="admin-form">
            <h3>Social Links</h3>
            {(data.socialLinks || []).map((s, i) => (
              <div key={i} className="admin-form__social-row">
                <span className="admin-form__social-label">{s.label || s.platform}</span>
                <input
                  type="url"
                  placeholder={`https://${s.platform}.com/...`}
                  value={s.url || ''}
                  onChange={e => {
                    const next = [...data.socialLinks];
                    next[i] = { ...next[i], url: e.target.value };
                    setData(prev => ({ ...prev, socialLinks: next }));
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="admin-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── AdminPage root ──────────────────────────────────────────────────────────
const AdminPage = () => {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('rb-admin-token'));

  const logout = () => {
    localStorage.removeItem('rb-admin-token');
    setAuthed(false);
  };

  return authed
    ? <Dashboard onLogout={logout} />
    : <PasswordGate onSuccess={() => setAuthed(true)} />;
};

export default AdminPage;
