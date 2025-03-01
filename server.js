const path = require("path");

// Servir les fichiers HTML, CSS et JS depuis "public"
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// server.js - Backend Express pour récupérer et filtrer les cotes
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { connectDB, Odds } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
connectDB();

// Endpoint pour récupérer toutes les cotes (triées par timestamp décroissant)
app.get('/odds', async (req, res) => {
    try {
        const odds = await Odds.find().sort({ timestamp: -1 });
        res.json(odds);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la récupération des données' });
    }
});

// Endpoint pour filtrer les cotes par intervalle de dates
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Serveur lancé sur le port ${PORT}`));

