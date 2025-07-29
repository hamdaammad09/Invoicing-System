const Client = require('../models/client');
const { ObjectId } = require('mongodb');

// TEMPORARY: Clear clients collection to remove old schema
exports.clearClientsCollection = async (req, res) => {
  try {
    // Drop the entire collection to remove old schema
    await Client.collection.drop();
    console.log('✅ Clients collection dropped successfully');
    res.json({ message: 'Clients collection cleared successfully. Old schema removed.' });
  } catch (error) {
    console.error('❌ Error clearing collection:', error);
    res.status(500).json({ error: 'Failed to clear collection' });
  }
};

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

// Get all clients as buyers
exports.getAllBuyers = async (req, res) => {
  try {
    const buyers = await Client.find({}, 'companyName buyerSTRN buyerNTN truckNo address phone')
      .sort({ companyName: 1 });
    res.status(200).json(buyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get only active buyers
exports.getActiveBuyers = async (req, res) => {
  try {
    const activeBuyers = await Client.find({ status: 'active' }, 'companyName buyerSTRN buyerNTN truckNo address phone')
      .sort({ companyName: 1 });
    res.status(200).json(activeBuyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Validate buyer data
exports.validateBuyer = async (req, res) => {
  try {
    const { buyerSTRN, buyerNTN } = req.body;
    
    // Check if buyer with this STRN or NTN already exists
    const existingBuyer = await Client.findOne({
      $or: [
        { buyerSTRN: buyerSTRN },
        { buyerNTN: buyerNTN }
      ]
    });
    
    if (existingBuyer) {
      return res.status(409).json({ 
        message: 'Buyer with this STRN or NTN already exists',
        existingBuyer: {
          companyName: existingBuyer.companyName,
          buyerSTRN: existingBuyer.buyerSTRN,
          buyerNTN: existingBuyer.buyerNTN
        }
      });
    }
    
    res.status(200).json({ message: 'Buyer data is valid' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
