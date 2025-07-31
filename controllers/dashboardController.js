const Invoice = require('../models/invoice');
const Client = require('../models/client');
const Task = require('../models/task');
const Service = require('../models/service');

exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Fetching dashboard stats...');
    
    // Get counts
    const totalClients = await Client.countDocuments();
    const totalInvoices = await Invoice.countDocuments();
    const totalTasks = await Task.countDocuments();
    const totalServices = await Service.countDocuments();
    
    // Get earnings
    const totalEarnings = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$finalValue' } } },
    ]);

    // Get task counts
    const pendingTasks = await Task.countDocuments({ status: 'pending' });
    const completedTasks = await Task.countDocuments({ status: 'completed' });

    // Get recent data
    const recentInvoices = await Invoice.find()
      .sort({ issuedDate: -1 })
      .limit(5)
      .populate('buyerId', 'companyName');

    const recentTasks = await Task.find()
      .sort({ createdDate: -1 })
      .limit(5);

    console.log('✅ Dashboard stats fetched successfully');

    res.json({
      totalClients,
      totalInvoices,
      totalTasks,
      totalServices,
      totalEarnings: totalEarnings.length > 0 ? totalEarnings[0].total : 0,
      pendingTasks,
      completedTasks,
      recentInvoices,
      recentTasks,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ 
      error: error.message,
      message: 'Failed to fetch dashboard statistics'
    });
  }
}; 