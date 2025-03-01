require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Connexion à MongoDB avec la bonne collection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connexion à MongoDB réussie"))
  .catch(err => console.error("❌ Erreur de connexion à MongoDB :", err));

const oddsSchema = new mongoose.Schema({
    sport: String,
    league: String,
    event: String,
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
}, { collection: 'abproject' }); // 📌 On force l'utilisation de la bonne collection

const Odds = mongoose.model('Odds', oddsSchema);

// 📌 1️⃣ Définir la route API qui récupère les cotes depuis "abproject"
app.get('/odds', async (req, res) => {
    try {
        const odds = await Odds.find().sort({ timestamp: -1 });
        res.json(odds);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données' });
    }
});

// 📌 2️⃣ Filtrer par date si nécessaire
app.get('/odds/filter', async (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) {
            return res.status(400).json({ error: 'Merci de spécifier start et end' });
        }
        const odds = await Odds.find({
            timestamp: {
                $gte: new Date(start),
                $lte: new Date(end)
            }
        }).sort({ timestamp: -1 });
        res.json(odds);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du filtrage des données' });
    }
});

// 📌 3️⃣ Servir le frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 📌 4️⃣ Démarrer le serveur avec le bon port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));
