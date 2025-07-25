const Invoice = require('../models/invoice');
const Client = require('../models/client');
const Task = require('../models/task');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEarnings = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } },
    ]);

    const activeClients = await Client.countDocuments();
    const invoicesSent = await Invoice.countDocuments();
    const pendingTasks = await Task.countDocuments({ status: 'pending' });

    const recentInvoices = await Invoice.find().sort({ issuedDate: -1 }).limit(5).populate('buyerInfo');
    const pendingTasksList = await Task.find({ status: 'pending' }).sort({ dueDate: 1 }).limit(5);

    res.json({
      totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
      activeClients,
      invoicesSent,
      pendingTasks,
      recentInvoices,
      pendingTasksList,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 