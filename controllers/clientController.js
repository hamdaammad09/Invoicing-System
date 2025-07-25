const Client = require('../models/client');
const { ObjectId } = require('mongodb');

// Add new client
exports.addClient = async (req, res) => {
  try {

    let id = new ObjectId();
    console.log(req.body);
    const client = new Client({...req.body, id: id.toString()});
    const savedClient = await client.save();
    res.status(201).json(savedClient);
  } catch (error) {
    console.error(error); // Add this line
    if (error.code === 11000) {
      // This error code indicates a duplicate key error
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ message: `A client with this ${field} already exists.` });
    }
    res.status(400).json({ message: 'Failed to add client. Please check the provided data.' });
  }
};

// Get all clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one client
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedClient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
