const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { importData } = require('./function/importData');

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/mydtb')
  .then(async () => {
    importData();
    
  })
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Setup Routes
const mapRouters = require('./routes/Map');
app.use('/Map', mapRouters);


const findRouters = require('./routes/Find');
app.use('/Find', findRouters);


// Khởi động server
app.listen(3001, () => console.log(' Server running at port 3001'));
