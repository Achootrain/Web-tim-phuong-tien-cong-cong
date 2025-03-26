const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { importData } = require('./data/importData');
const Station = require('./models/BusStation'); // Thêm để kiểm tra dữ liệu

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/mydtb')
  .then(async () => {
    console.log('✅ Kết nối MongoDB thành công');

    // Kiểm tra nếu collection trống thì import
    const count = await Station.countDocuments();
    if (count === 0) {
      console.log('Chưa có dữ liệu, bắt đầu import...');
      await importData();
    } else {
      console.log('Dữ liệu đã có sẵn, không cần import.');
    }
  })
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err));

// Setup Routes
const mapRouters = require('./routes/Map');
app.use('/Map', mapRouters);

const usersRouters = require('./routes/Users');
app.use('/Users', usersRouters);

const findRouters = require('./routes/Find');
app.use('/Find', findRouters);


// Khởi động server
app.listen(3001, () => console.log('🚀 Server đang chạy ở port 3001'));
