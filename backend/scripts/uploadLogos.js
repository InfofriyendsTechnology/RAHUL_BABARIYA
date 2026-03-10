/**
 * uploadLogos.js
 * ──────────────
 * 1. Uploads Aurpix_Studio.jpg + Dada_media.jpg to Cloudinary as WebP
 * 2. Upserts the full portfolio document with all contact / social data
 *
 * Run from backend/ dir:  node scripts/uploadLogos.js
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend/
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Cloudinary ────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Mongoose inline schema (mirrors Portfolio.js) ─────────────────────────────
const socialLinkSchema = new mongoose.Schema(
  { platform: String, label: String, url: String, icon: String },
  { _id: false }
);
const serviceSchema = new mongoose.Schema(
  { name: String, description: String, price: String },
  { _id: false }
);
const gallerySchema = new mongoose.Schema(
  { url: String, caption: String },
  { _id: false }
);
const businessSchema = new mongoose.Schema(
  {
    name: String, tagline: String, description: String,
    logo: String, address: String, phone: String, email: String,
    services: [serviceSchema], gallery: [gallerySchema],
    socialLinks: [socialLinkSchema],
  },
  { _id: false }
);
const portfolioSchema = new mongoose.Schema(
  {
    owner: {
      name: String, tagline: String, bio: String, photo: String,
      phone: String, whatsapp: String, email: String, address: String,
    },
    businesses: { aurpix: businessSchema, dada: businessSchema },
    socialLinks: [socialLinkSchema],
  },
  { timestamps: true }
);
const Portfolio =
  mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadLogo(filePath, publicId) {
  process.stdout.write(`  Uploading ${publicId}... `);
  const res = await cloudinary.uploader.upload(filePath, {
    folder:     'rahul-babariya/logos',
    public_id:  publicId,
    format:     'webp',
    overwrite:  true,
    quality:    'auto',
  });
  console.log('✅', res.secure_url);
  return res.secure_url;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected\n');

  // 1. Upload logos
  console.log('📸 Uploading logos to Cloudinary...');
  const aurpixLogo = await uploadLogo(
    path.resolve(__dirname, '../../frontend/src/assets/Aurpix_Studio.jpg'),
    'aurpix-logo'
  );
  const dadaLogo = await uploadLogo(
    path.resolve(__dirname, '../../frontend/src/assets/Dada_media.jpg'),
    'dada-logo'
  );

  // 2. Seed portfolio data
  console.log('\n💾 Saving portfolio data to MongoDB...');
  await Portfolio.findOneAndUpdate(
    {},
    {
      $set: {
        // ── Owner ──────────────────────────────────────────────────────────
        'owner.name':     'Rahul Babariya',
        'owner.tagline':  'Photographer & Creative Director',
        'owner.phone':    '9375757594',
        'owner.whatsapp': '919375757594',
        'owner.email':    'rahulbabariya130@gmail.com',
        'owner.address':  'Surat, Gujarat, India',

        // ── Aurpix Studio ──────────────────────────────────────────────────
        'businesses.aurpix.name':    'Aurpix Studio',
        'businesses.aurpix.tagline': 'Studio Photography Specialists',
        'businesses.aurpix.phone':   '07574026740',
        'businesses.aurpix.email':   'aurpixstudio@gmail.com',
        'businesses.aurpix.address': '1st Floor, Yogeshwar Soc. Gate No 7, Near Shyamdham Mandir, Sarthana Jakatnaka, Surat 395007',
        'businesses.aurpix.logo':    aurpixLogo,
        'businesses.aurpix.socialLinks': [
          {
            platform: 'instagram',
            label:    'Instagram',
            url:      'https://www.instagram.com/aurpix_photo_studio_surat/',
            icon:     'FaInstagram',
          },
          {
            platform: 'maps',
            label:    'Maps',
            url:      'https://maps.app.goo.gl/tZLqdG1U44nU98Dk7',
            icon:     'FiMapPin',
          },
        ],

        // ── Dada Media ────────────────────────────────────────────────────
        'businesses.dada.name':    'Dada Media',
        'businesses.dada.tagline': 'Wedding & Event Photography',
        'businesses.dada.phone':   '9375757594',
        'businesses.dada.address': '2nd Floor, Shraddha Raw House, opp. Sarthana Community Hall, Sarthana Jakat Naka, Nana Varachha, Surat 395013',
        'businesses.dada.logo':    dadaLogo,
        'businesses.dada.socialLinks': [
          {
            platform: 'instagram',
            label:    'Instagram',
            url:      'https://www.instagram.com/dada_media_/',
            icon:     'FaInstagram',
          },
          {
            platform: 'youtube',
            label:    'YouTube',
            url:      'https://www.youtube.com/@dadamedia94',
            icon:     'FaYoutube',
          },
          {
            platform: 'facebook',
            label:    'Facebook',
            url:      'https://www.facebook.com/dadamedia.india/',
            icon:     'FaFacebook',
          },
          {
            platform: 'maps',
            label:    'Maps',
            url:      'https://maps.app.goo.gl/F93GipSWu6GeDkVZ8',
            icon:     'FiMapPin',
          },
        ],
      },
    },
    { upsert: true, new: true }
  );

  console.log('✅ Portfolio data saved!\n');
  console.log('─────────────────────────────────────────');
  console.log('Aurpix logo :', aurpixLogo);
  console.log('Dada logo   :', dadaLogo);
  console.log('─────────────────────────────────────────\n');
  console.log('🎉 Done! Both logos uploaded and all data seeded.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
