const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/user');
const postRoutes = require('./routes/post');

const app = express();

app.use(cors());
app.use(express.json());

// --- MongoDB Atlas Connection (NO extra options needed)
mongoose.connect('mongodb+srv://vishal:vishal123@cluster0.ndywf6l.mongodb.net/socialmedia?retryWrites=true&w=majority')
  .then(() => console.log('MongoDB Atlas connected'))
  .catch(err => console.log('Connection error:', err));

// --- API Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// --- Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
