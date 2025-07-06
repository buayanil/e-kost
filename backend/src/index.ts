import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create the Express app
const app = express();

// Middleware
app.use(cors());              // Allows frontend to access backend
app.use(express.json());      // Parses JSON in request bodies

// Test route
app.get('/', (req, res) => {
    res.send('✅ e-kost backend is running');
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
