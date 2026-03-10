/**
 * seedCloudinary.js
 * -----------------
 * Uploads local frontend images to Cloudinary and seeds MongoDB.
 * Run once:  node scripts/seedCloudinary.js
 * After:     safe to delete frontend/src/assets/aurpix, dada, owner
 */

import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(__dirname, '../../frontend/src/assets');

// ── Cloudinary config ────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── MongoDB model (inline to keep script self-contained) ────────────────────
const gallerySchema = new mongoose.Schema({ url: String, caption: String }, { _id: false });
const serviceSchema = new mongoose.Schema({ name: String, description: String, price: String }, { _id: false });
const bizSchema    = new mongoose.Schema({
  name: String, tagline: String, description: String, logo: String,
  services: [serviceSchema], gallery: [gallerySchema], socialLinks: [mongoose.Schema.Types.Mixed],
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  owner: {
    name: { type: String, default: 'Rahul Babariya' },
    tagline: { type: String, default: 'Photographer & Creative Director' },
    bio: String, photo: String, phone: String, whatsapp: String, email: String, address: String,
  },
  businesses: { aurpix: bizSchema, dada: bizSchema },
  socialLinks: [mongoose.Schema.Types.Mixed],
}, { timestamps: true });

const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);

// ── Helper: upload one file ──────────────────────────────────────────────────
async function upload(filePath, folder) {
  const res = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
    use_filename: false,
    unique_filename: true,
  });
  return res.secure_url;
}

// ── Helper: get sorted files in a dir ───────────────────────────────────────
function getWebps(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.webp'))
    .sort()
    .map(f => path.join(dir, f));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected\n');

  // ── 1. Upload owner photo ─────────────────────────────────────────────────
  console.log('📸 Uploading owner photo...');
  const ownerPhotoPath = path.join(ASSETS, 'owner', 'rahul.webp');
  const ownerPhotoUrl  = await upload(ownerPhotoPath, 'rahul-babariya/owner');
  console.log('   ✓', ownerPhotoUrl);

  // ── 2. Upload Aurpix gallery ──────────────────────────────────────────────
  const aurpixFiles = getWebps(path.join(ASSETS, 'aurpix'));
  console.log(`\n🖼  Uploading Aurpix Studio gallery (${aurpixFiles.length} images)...`);
  const aurpixGallery = [];
  for (let i = 0; i < aurpixFiles.length; i++) {
    const url = await upload(aurpixFiles[i], 'rahul-babariya/aurpix');
    aurpixGallery.push({ url, caption: '' });
    console.log(`   ✓ [${i + 1}/${aurpixFiles.length}]`, url);
  }

  // ── 3. Upload Dada Media gallery ──────────────────────────────────────────
  const dadaFiles = getWebps(path.join(ASSETS, 'dada'));
  console.log(`\n🎬 Uploading Dada Media gallery (${dadaFiles.length} images)...`);
  const dadaGallery = [];
  for (let i = 0; i < dadaFiles.length; i++) {
    const url = await upload(dadaFiles[i], 'rahul-babariya/dada');
    dadaGallery.push({ url, caption: '' });
    console.log(`   ✓ [${i + 1}/${dadaFiles.length}]`, url);
  }

  // ── 4. Upsert portfolio in MongoDB ────────────────────────────────────────
  console.log('\n💾 Saving to MongoDB...');
  await Portfolio.findOneAndUpdate(
    {},
    {
      $set: {
        'owner.photo':                   ownerPhotoUrl,
        'owner.name':                    'Rahul Babariya',
        'owner.tagline':                 'Photographer & Creative Director',
        'owner.bio':                     "Capturing life's most precious moments through the lens. Owner of Aurpix Studio & Dada Media.",
        'owner.address':                 'Gujarat, India',
        'businesses.aurpix.name':        'Aurpix Studio',
        'businesses.aurpix.tagline':     'Studio Photography Specialists',
        'businesses.aurpix.description': 'Professional indoor photography studio specializing in newborn, baby milestone, maternity, family portraits and kids photography.',
        'businesses.aurpix.gallery':     aurpixGallery,
        'businesses.aurpix.services': [
          { name: 'Newborn Photography', description: 'Themed newborn shoots with props & soft lighting',  price: 'Contact for pricing' },
          { name: 'Baby Milestones',     description: '1/2 year, 1st birthday & birthday shoots',          price: 'Contact for pricing' },
          { name: 'Maternity Shoot',     description: 'Elegant indoor maternity photography',               price: 'Contact for pricing' },
          { name: 'Family Portrait',     description: 'Professional family & group portraits',              price: 'Contact for pricing' },
          { name: 'Kids Photography',    description: 'Fun & creative kids themed photo sessions',          price: 'Contact for pricing' },
        ],
        'businesses.dada.name':        'Dada Media',
        'businesses.dada.tagline':     'Wedding & Event Photography',
        'businesses.dada.description': 'Cinematic outdoor photography and videography for weddings, pre-weddings, mehndi ceremonies and special life events.',
        'businesses.dada.gallery':     dadaGallery,
        'businesses.dada.services': [
          { name: 'Wedding Photography', description: 'Full wedding day coverage with cinematic editing', price: 'Contact for pricing' },
          { name: 'Pre-Wedding Shoot',   description: 'Creative outdoor pre-wedding photography',         price: 'Contact for pricing' },
          { name: 'Mehndi Ceremony',     description: 'Traditional ceremony documentation',               price: 'Contact for pricing' },
          { name: 'Baby Welcome Event',  description: 'Baby shower & welcome ceremony coverage',          price: 'Contact for pricing' },
          { name: 'Drone / Aerial',      description: 'Stunning aerial perspectives for events',          price: 'Contact for pricing' },
        ],
        socialLinks: [
          { platform: 'instagram', label: 'Instagram', url: '', icon: 'FaInstagram' },
          { platform: 'facebook',  label: 'Facebook',  url: '', icon: 'FaFacebook'  },
          { platform: 'youtube',   label: 'YouTube',   url: '', icon: 'FaYoutube'   },
          { platform: 'whatsapp',  label: 'WhatsApp',  url: '', icon: 'FaWhatsapp'  },
        ],
      },
    },
    { upsert: true, new: true }
  );
  console.log('✅ MongoDB seeded!\n');

  console.log('🎉 All done! You can now safely delete:');
  console.log('   frontend/src/assets/aurpix/');
  console.log('   frontend/src/assets/dada/');
  console.log('   frontend/src/assets/owner/');
  console.log('   frontend/src/utils/defaults.js\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
