import mongoose from 'mongoose';

const socialLinkSchema = new mongoose.Schema({
  platform: String,
  label:    String,
  url:      String,
  icon:     String,
}, { _id: false });

const serviceSchema = new mongoose.Schema({
  name:        String,
  description: String,
  price:       String,
}, { _id: false });

const galleryImageSchema = new mongoose.Schema({
  url:     String,
  caption: String,
}, { _id: false });

const businessSchema = new mongoose.Schema({
  name:        String,
  tagline:     String,
  description: String,
  logo:        String,
  address:     String,
  phone:       String,
  email:       String,
  services:    [serviceSchema],
  gallery:     [galleryImageSchema],
  socialLinks: [socialLinkSchema],
}, { _id: false });

const portfolioSchema = new mongoose.Schema({
  // singleton — always one document
  owner: {
    name:        { type: String, default: 'Rahul Babariya' },
    tagline:     { type: String, default: 'Photographer & Creative Director' },
    bio:         { type: String, default: '' },
    photo:       { type: String, default: '' },
    phone:       { type: String, default: '' },
    whatsapp:    { type: String, default: '' },
    email:       { type: String, default: '' },
    address:     { type: String, default: '' },
  },
  businesses: {
    aurpix: { type: businessSchema, default: () => ({}) },
    dada:   { type: businessSchema, default: () => ({}) },
  },
  socialLinks: [socialLinkSchema],
}, { timestamps: true });

export default mongoose.model('Portfolio', portfolioSchema);
