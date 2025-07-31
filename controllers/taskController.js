const Task = require('../models/task');

// Create Task
exports.createTask = async (req, res) => {
  try {
    console.log('🔄 Creating task with data:', req.body);
    
    const task = new Task(req.body);
    await task.save();
    
    console.log('✅ Task created successfully:', task._id);
    res.status(201).json(task);
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(500).json({ 
      error: 'Failed to create task',
      message: error.message 
    });
  }
};

// Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    console.log('🔄 Fetching all tasks...');
    
    const tasks = await Task.find()
      .populate('client', 'companyName buyerSTRN buyerNTN address phone')
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks`);
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks',
      message: error.message 
    });
  }
};

// Get Single Task
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Fetching task by ID:', id);
    
    const task = await Task.findById(id)
      .populate('client', 'companyName buyerSTRN buyerNTN address phone');
    
    if (!task) {
      console.log('❌ Task not found:', id);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('✅ Task found:', task._id);
    res.json(task);
  } catch (error) {
    console.error('❌ Error fetching task:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task',
      message: error.message 
    });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Updating task:', id, 'with data:', req.body);
    
    const task = await Task.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('client', 'companyName buyerSTRN buyerNTN address phone');
    
    if (!task) {
      console.log('❌ Task not found for update:', id);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('✅ Task updated successfully:', task._id);
    res.json(task);
  } catch (error) {
    console.error('❌ Error updating task:', error);
    res.status(500).json({ 
      error: 'Failed to update task',
      message: error.message 
    });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Deleting task:', id);
    
    const task = await Task.findByIdAndDelete(id);
    
    if (!task) {
      console.log('❌ Task not found for deletion:', id);
      return res.status(404).json({ error: 'Task not found' });
    }
    
    console.log('✅ Task deleted successfully:', id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({ 
      error: 'Failed to delete task',
      message: error.message 
    });
  }
};

// Get Tasks by Type
exports.getTasksByType = async (req, res) => {
  try {
    const { type } = req.params;
    console.log('🔄 Fetching tasks by type:', type);
    
    const tasks = await Task.find({ taskType: type })
      .populate('client', 'companyName buyerSTRN buyerNTN address phone')
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks of type: ${type}`);
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks by type:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks by type',
      message: error.message 
    });
  }
};

// Get Tasks by Status
exports.getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    console.log('🔄 Fetching tasks by status:', status);
    
    const tasks = await Task.find({ status: status })
      .populate('client', 'companyName buyerSTRN buyerNTN address phone')
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks with status: ${status}`);
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks by status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks by status',
      message: error.message 
    });
  }
};

// Get Tasks by Priority
exports.getTasksByPriority = async (req, res) => {
  try {
    const { priority } = req.params;
    console.log('🔄 Fetching tasks by priority:', priority);
    
    const tasks = await Task.find({ priority: priority })
      .populate('client', 'companyName buyerSTRN buyerNTN address phone')
      .sort({ createdDate: -1 });
    
    console.log(`✅ Found ${tasks.length} tasks with priority: ${priority}`);
    res.json(tasks);
  } catch (error) {
    console.error('❌ Error fetching tasks by priority:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tasks by priority',
      message: error.message 
    });
  }
};

// Get Task Statistics
exports.getTaskStats = async (req, res) => {
  try {
    console.log('🔄 Fetching task statistics...');
    
    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      highPriorityTasks,
      fbrTasks
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ priority: 'high' }),
      Task.countDocuments({ taskType: { $regex: /fbr/ } })
    ]);
    
    const stats = {
      total: totalTasks,
      pending: pendingTasks,
      completed: completedTasks,
      high: highPriorityTasks,
      fbr: fbrTasks
    };
    
    console.log('✅ Task statistics:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching task statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch task statistics',
      message: error.message 
    });
  }
}; 