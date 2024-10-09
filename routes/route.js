// routes/route.js
import express from 'express';
import Item from '../models/Items.js';

const router = express.Router();

// CREATE: Add a new item
router.post('/items', async (req, res) => {
  const { name, description } = req.body;
  const newItem = new Item({ name, description });

  try {
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating item', error });
  }
});

// READ: Get all items
router.get('/items', async (req, res) => {
  try {
    const items = await Item.find();
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error });
  }
});

// READ: Get a single item by ID
router.get('/items/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item', error });
  }
});

// UPDATE: Update an item by ID
router.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const updatedItem = await Item.findByIdAndUpdate(id, updates, { new: true });
    if (!updatedItem) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating item', error });
  }
});

// DELETE: Delete an item by ID
router.delete('/items/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting item', error });
  }
});

export default router;
