
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
  origin: "http://localhost:5173"
}));

app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.log("MongoDB connection error:", error));

// Mongoose Schema
const recordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  category: {
    type: String,
    default: "General"
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Mongoose Model
const Record = mongoose.model("Record", recordSchema);

// GET: Fetch all records
app.get("/api/records", async (req, res, next) => {
  try {
    const records = await Record.find();
    res.status(200).json(records);
  } catch (error) {
    next(error);
  }
});

// GET: Fetch one record by ID
app.get("/api/records/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid record ID" });
    }

    const record = await Record.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json(record);
  } catch (error) {
    next(error);
  }
});

// POST: Create a new record
app.post("/api/records", async (req, res, next) => {
  try {
    const { name, email, category, details } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }

    const newRecord = new Record({
      name,
      email,
      category,
      details
    });

    const savedRecord = await newRecord.save();

    res.status(201).json({
      message: "Record created successfully",
      record: savedRecord
    });
  } catch (error) {
    next(error);
  }
});

// PUT: Update a record
app.put("/api/records/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid record ID" });
    }

    if (req.body.name !== undefined && !req.body.name.trim()) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({
      message: "Record updated successfully",
      record: updatedRecord
    });
  } catch (error) {
    next(error);
  }
});

// DELETE: Delete a record
app.delete("/api/records/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid record ID" });
    }

    const deletedRecord = await Record.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Central error-handling middleware
app.use((error, req, res, next) => {
  console.error(error);

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  res.status(500).json({ message: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
