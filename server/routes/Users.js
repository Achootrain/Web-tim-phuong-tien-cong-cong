const express = require('express');
const router = express.Router();
const Users = require('../models/Users');


router.get('/', async (req, res) => {
   res.json("hello")
});

module.exports = router;
