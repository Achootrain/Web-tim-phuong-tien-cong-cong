const express = require('express');
const router = express.Router();
const axios = require('axios');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, 
    message: { error: "Too many requests, please try again later." }
});

router.get('/get', limiter, async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: "Address parameter is required" });
        }
        const apiKey = process.env.GOONG_API;
        const url = `https://rsapi.goong.io/geocode?address=${encodeURIComponent(address)}&api_key=${apiKey}`;
        const response = await axios.get(url);
        const results = response.data.results;

        if (!results || results.length === 0) {
            return res.status(404).json({ error: "No results found" });
        }
        const coordinates = results.slice(0, 3).map(result => ({
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
        }));

        return res.json(coordinates);
    } catch (error) {
        console.error("Error fetching geocode data:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
