// database.js - Connexion MongoDB
require('dotenv').config();
const mongoose = require('mongoose');

const mongoURI = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

const OddsSchema = new mongoose.Schema({
    sport: String,
    league: String,
    event: String,
    event_date: Date,
    home_team: String,
    away_team: String,
    bookmaker1: String,
    bookmaker2: String,
    best_odds1: Number,
    best_odds2: Number,
    stake1: String,
    stake2: String,
    profit: String,
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

const Odds = mongoose.model('Odds', OddsSchema, 'oddsData');

async function connectDB() {
    try {
        await mongoose.connect(mongoURI, { dbName });
        console.log('✅ Connexion à MongoDB réussie');
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB :', error);
        process.exit(1);
    }
}

module.exports = { connectDB, Odds };
