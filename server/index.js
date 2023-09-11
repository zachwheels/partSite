const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'images', req.body.partNumber);
    
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const partNumber = req.body.partNumber;
    const fileExtension = path.extname(file.originalname);
    const fileName = `${partNumber}_${Date.now()}${fileExtension}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

const db = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "in7@Secticide",
  database: "parts",
});

app.post("/addAPart", upload.array('images', 5), (req, res) => {
  const partNumber = req.body.partNumber;
  const partName = req.body.partName;
  const manufacturer = req.body.manufacturer;
  const boxNumber = req.body.boxNumber;
  const weight = req.body.weight;
  const numberOwned = req.body.numberOwned;
  const groupNumber = req.body.groupNumber

  const images = req.files;

  images.forEach((image, index) => {
    const filename = partNumber + '_' + index + path.extname(image.originalname);
    fs.renameSync(image.path, path.join(image.destination, filename));
  });

  db.query(
    "INSERT INTO part_table(part_number, weight, manufacturer, number_owned, box_number, part_name, group_number) VALUES (?,?,?,?,?,?,?)",
    [partNumber, weight, manufacturer, numberOwned, boxNumber, partName, groupNumber],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: err.sqlMessage });
      } else {
        res.status(200).json({ message: "Part added successfully" });
      }
    }
  );
});

app.post("/addListedTag", (req, res) => {
  const partNumber = req.body.partNumber;
  const sql = "UPDATE part_table SET listed = 1 WHERE part_number = ?";

  db.query(sql, [partNumber], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err.sqlMessage });
    } else {
      res.status(200).json({ message: "Part updated successfully" });
    }
  });
});

app.get("/findBox", (req, res) => {
  const partNumber = req.query.partNumber;

  const sql = "SELECT box_number FROM part_table WHERE part_number = ?";

  db.query(sql, [partNumber], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err.sqlMessage });
    } else {
      if (result.length > 0) {
        const retrievedValue = result[0].box_number;
        res.status(200).json({ message: "Part found", retrievedValue });
      } else {
        res.status(404).json({ error: "Part not found" });
      }
    }
  });
});

app.post("/movePart", (req, res) => {
  const partNumber = req.body.partNumber;
  const boxNumber = req.body.boxNumber;
  const sql = "UPDATE part_table SET box_number = ? WHERE part_number = ?";

  db.query(sql, [boxNumber, partNumber], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err.sqlMessage });
    } else {
      res.status(200).json({ message: "Part updated successfully" });
    }
  });
});

app.post("/moveToSold", (req, res) => {
  const partNumber = req.body.partNumber;
  const soldPrice = req.body.soldPrice;
  const sql =
    "UPDATE part_table SET sale_price = ?, sold = 1 WHERE part_number = ?";

  db.query(sql, [soldPrice, partNumber], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err.sqlMessage });
    } else {
      res.status(200).json({ message: "Part updated successfully" });
    }
  });
});

app.get("/displayPart", (req, res) => {
  const partNumber = req.query.partNumber;

  const sql =
    "SELECT part_number, weight, manufacturer, number_owned, box_number, part_name, listed, sold, sale_price FROM part_table WHERE part_number = ?";

  db.query(sql, [partNumber], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: err.sqlMessage });
    } else {
      if (result.length > 0) {
        const part_number = result[0].part_number;
        const weight = result[0].weight;
        const manufacturer = result[0].manufacturer;
        const number_owned = result[0].number_owned;
        const box_number = result[0].box_number;
        const part_name = result[0].part_name;
        const listed = result[0].listed;
        const sold = result[0].sold;
        const sale_price = result[0].sale_price;
        res.status(200).json({ message: "Part found", part_number, weight, manufacturer, number_owned, box_number, part_name, listed, sold, sale_price });
      } else {
        res.status(404).json({ error: "Part not found" });
      }
    }
  });
});

app.listen(3001, () => {
  console.log("server is running on port 3001");
});
