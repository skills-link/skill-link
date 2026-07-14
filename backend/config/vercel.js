const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: 'https://skillslink.vercel.app', // Your actual frontend Vercel URL
  credentials: true
}));