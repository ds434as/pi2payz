const express = require('express');
const Adminroute = express.Router();
const adminController = require("../Controllers/adminController");
const { authenticate, authorizeAdmin } = require('../Middlewares/authMiddleware');
const UserModel = require('../Models/User');
const PrepaymentRequest = require('../Models/PrepaymentRequest');
const BankAccount = require('../Models/BankAccount');
const PayinTransaction = require('../Models/PayinTransaction');
const ForwardedSms = require('../Models/ForwardedSms');
const PayoutTransaction = require('../Models/PayoutTransaction');
const bcrypt=require("bcrypt")

// Protect all admin routes
// Adminroute.use(authenticate);
// Adminroute.use(authorizeAdmin);

// Get all users
Adminroute.get('/users', adminController.getAllUsers);

// Get active users
Adminroute.get('/users/active', adminController.getActiveUsers);

// Get inactive users
Adminroute.get('/users/inactive', adminController.getInactiveUsers);

// delete user by ID
Adminroute.delete('/users/:id',async (req,res)=>{
    try {
        const user=await UserModel.findById({_id:req.params.id});
        if(!user){
            return res.send({success:false,message:"Agent did not find."})
        }
        await UserModel.findByIdAndDelete({_id:req.params.id});
        res.send({success:true,message:"Agent deleted successfully."})
    } catch (error) {
        console.log(error)
    }
});
Adminroute.get("/single-user-payin/:id",async(req,res)=>{
  try {
    const payin=await PayinTransaction.find({userid:req.params.id});
    const payout=await PayoutTransaction.find({update_by:req.params.id});
    if(!payin){
       return res.send({success:false,message:"Payin not found."})
    }
        if(!payout){
       return res.send({success:false,message:"Payin not found."})
    }
    res.send({success:true,payin,payout})
  } catch (error) {
    console.log(error)
  }
})
// update user
Adminroute.put('/users-commissions/:id',async (req,res)=>{
    try {
        const {withdracommission,depositcommission,paymentMethod,paymentBrand}=req.body;
        const user=await UserModel.findById({_id:req.params.id});
        if(!user){
            return res.send({success:false,message:"Agent did not find."})
        }
        await UserModel.findByIdAndUpdate({_id:req.params.id},{$set:{withdracommission:withdracommission,depositcommission:depositcommission,paymentMethod:paymentMethod,paymentbrand:paymentBrand}});
        res.send({success:true,message:"Agent updated successfully."});
    } catch (error) {
        console.log(error)
    }
});
// Update user status
Adminroute.patch('/users/:id/status', adminController.updateUserStatus);
Adminroute.put("/user-currentstatus/:id",async (req, res) => {
  try {
    const { currentstatus } = req.body;
      console.log(currentstatus)


    const user = await UserModel.findByIdAndUpdate(
      req.params.id,
      { currentstatus },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
})
// Get all prepayment requests
Adminroute.get('/prepayment-requests', async (req, res) => {
    try {
        const requests = await PrepaymentRequest.find().sort({ requestDate: -1 });
        res.send({ success: true, data: requests });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching prepayment requests" });
    }
});
Adminroute.get('/single-user/:id',async(req,res)=>{
    try {
        const user=await UserModel.findById({_id:req.params.id});
        const bankaccount=await BankAccount.find({user_id:req.params.id})
        if(!user){
            return res.send({success:false,message:"User did not find."})
        }
        res.send({success:true,user,bankaccount});
    } catch (error) {
        console.log(error)
    }
});
// -------------------------update-user-information----------------------------
// Update user profile
Adminroute.put('/users/:id', async (req, res) => {
  try {
    const {
      username,
      name,
      email,
      identity,
      role,
      status,
      is_admin,
      withdracommission,
      depositcommission,
      paymentMethod,
      paymentbrand,
      currency
    } = req.body;

    // Find the user
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // Prepare update object
    const updateData = {
      username: username || user.username,
      name: name || user.name,
      email: email || user.email,
      identity: identity || user.identity,
      role: role || user.role,
      status: status || user.status,
      is_admin: is_admin !== undefined ? is_admin : user.is_admin,
      withdracommission: withdracommission !== undefined ? withdracommission : user.withdracommission,
      depositcommission: depositcommission !== undefined ? depositcommission : user.depositcommission,
      paymentMethod: paymentMethod || user.paymentMethod,
      paymentbrand: paymentbrand || user.paymentbrand,
      currency: currency || user.currency
    };

    // Update the user
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -__v');

    res.send({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      // Handle duplicate key error (unique fields)
      return res.status(400).send({
        success: false,
        message: 'Username or email already exists'
      });
    }
    res.status(500).send({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Update agent account
Adminroute.put('/users/:userId/agent-accounts/:accountId', async (req, res) => {
  try {
    const { userId, accountId } = req.params;
    const updateData = req.body;

    // Find the user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    // Find the agent account
    const accountIndex = user.agentAccounts.findIndex(acc => acc._id.equals(accountId));
    if (accountIndex === -1) {
      return res.status(404).send({ success: false, message: 'Agent account not found' });
    }

    // Handle default account setting
    if (updateData.isDefault) {
      user.agentAccounts.forEach(account => {
        account.isDefault = false;
      });
    }

    // Update the account
    user.agentAccounts[accountIndex] = {
      ...user.agentAccounts[accountIndex].toObject(),
      ...updateData,
      updatedAt: Date.now()
    };

    // Save the user
    const updatedUser = await user.save();

    res.send({
      success: true,
      message: 'Agent account updated successfully',
      data: updatedUser.agentAccounts[accountIndex]
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error updating agent account'
    });
  }
});

// Update user balance
Adminroute.put('/users/:id/balance', async (req, res) => {
  try {
    const { balance } = req.body;

    if (typeof balance !== 'number') {
      return res.status(400).send({ success: false, message: 'Balance must be a number' });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { balance },
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    res.send({
      success: true,
      message: 'Balance updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error updating balance'
    });
  }
});

// Update user password (admin can reset password)
Adminroute.put('/users/:id/password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).send({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { password: newPassword },
      { new: true }
    ).select('-password -__v');

    if (!updatedUser) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }

    res.send({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: 'Error updating password'
    });
  }
});
// Get requests by status
Adminroute.get('/prepayment-requests/:status', async (req, res) => {
    try {
        const status = req.params.status;
        if (!['Resolved', 'Pending', 'Rejected'].includes(status)) {
            return res.status(400).send({ success: false, message: "Invalid status" });
        }
        const requests = await PrepaymentRequest.find({ status }).sort({ requestDate: -1 });
        res.send({ success: true, data: requests });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error fetching prepayment requests" });
    }
});

// Update prepayment request status
Adminroute.patch('/prepayment-requests/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Resolved', 'Pending', 'Rejected'].includes(status)) {
            return res.status(400).send({ success: false, message: "Invalid status" });
        }
        
        const request = await PrepaymentRequest.findByIdAndUpdate(
            req.params.id,
            { status, updateDate: new Date() },
            { new: true }
        );
          
        if (!request) {
            return res.status(404).send({ success: false, message: "Request not found" });
        }
    
        res.send({ success: true, message: "Status updated successfully", data: request });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error updating request status" });
    }
});

// Update prepayment request details
Adminroute.put('/prepayment-requests/:id', async (req, res) => {
    try {
        const { requestAmount, paidAmount, note, status } = req.body;

        // Convert paidAmount to number
        const paidAmountNumber = Number(paidAmount);

        const request = await PrepaymentRequest.findByIdAndUpdate(
            req.params.id,
            { 
                requestAmount, 
                paidAmount: paidAmountNumber,  // Use the converted number
                note,
                status,
                updateDate: new Date() 
            },
            { new: true }
        );
        
        const find_user = await UserModel.findById({_id: request.userid});
        
        if(status === "Resolved") {
            // Ensure we're adding a number to the balance
            find_user.balance += paidAmountNumber;
            find_user.totalprepayment+=paidAmountNumber;
            await find_user.save();
        }
        
        if (!request) {
            return res.status(404).send({ success: false, message: "Request not found" });
        }

        res.send({ success: true, message: "Request updated successfully", data: request });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error updating request" });
    }
});
// Delete prepayment request
Adminroute.delete('/prepayment-requests/:id', async (req, res) => {
    try {
        const request = await PrepaymentRequest.findByIdAndDelete(req.params.id);
        if (!request) {
            return res.status(404).send({ success: false, message: "Request not found" });
        }
        res.send({ success: true, message: "Request deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: "Error deleting request" });
    }
});
// Get a single bank account
Adminroute.get('/bank-account/:id', async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOne({ 
      _id: req.params.id, 
      user_id: req.user._id 
    });

    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    res.json({
      success: true,
      data: bankAccount
    });
  } catch (error) {
    console.error('Error fetching bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching the bank account',
      error: error.message 
    });
  }
});

// Update a bank account
Adminroute.put('/update-bank-account/:id',async (req, res) => {
  try {
    const { provider, accountNumber, shopName, walletType } = req.body;
    
    // Validate required fields
    if (!provider || !accountNumber || !shopName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Provider, account number, and shop name are required' 
      });
    }

    // Validate account number format
    const accountNumberRegex = /^01\d{9}$/;
    if (!accountNumberRegex.test(accountNumber)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid account number format. Must be 11 digits starting with 01' 
      });
    }

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: bankAccount
    });
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating the bank account',
      error: error.message 
    });
  }
});

// Delete a bank account
Adminroute.delete('/delete-bank-account/:id', async (req, res) => {
  try {
    const bankAccount = await BankAccount.findOneAndDelete({ 
      _id: req.params.id, 
    });

    if (!bankAccount) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bank account not found' 
      });
    }

    res.json({
      success: true,
      message: 'Bank account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while deleting the bank account',
      error: error.message 
    });
  }
});
// Admin route to update bank account status
Adminroute.put('/bank-account-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Validate status
    if (!['active', 'inactive', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, pending'
      });
    }

    const bankAccount = await BankAccount.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true, runValidators: true }
    );

    if (!bankAccount) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }

    res.json({
      success: true,
      message: 'Bank account status updated successfully',
      data: bankAccount
    });

  } catch (error) {
    console.error('Error updating bank account status:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the bank account status',
      error: error.message
    });
  }
});



// -----------------------payment--=------------------------------------
// Create new transaction
Adminroute.post('/payin', async (req, res) => {
  try {
    const transaction = new PayinTransaction(req.body);
    const savedTransaction = await transaction.save();
    res.status(201).json(savedTransaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Get all transactions with pagination, filtering, and sorting
Adminroute.get('/all-payin', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', status, provider, paymentType, search } = req.query;
    
    const query = {};
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Filter by provider if provided
    if (provider) {
      query.provider = provider;
    }
    
    // Filter by paymentType if provided
    if (paymentType) {
      query.paymentType = paymentType;
    }
    
    // Search functionality using text index
    if (search) {
      query.$text = { $search: search };
    }
    
    const transactions = await PayinTransaction.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((page - 1) * limit)
      .exec();
    
    const count = await PayinTransaction.countDocuments(query);
    
    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalTransactions: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single transaction by ID
Adminroute.get('/payin/:id', async (req, res) => {
  try {
    const transaction = await PayinTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// Update transaction
Adminroute.put('/payin/:id', async (req, res) => {
  try {
    const transaction = await PayinTransaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete transaction
Adminroute.delete('/payin/:id', async (req, res) => {
  try {
    const transaction = await PayinTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change transaction status
Adminroute.patch('/payin/:id/status', async (req, res) => {
  try {
    const { status, update_by } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const transaction = await PayinTransaction.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        statusDate: new Date(),
        update_by: update_by || ''
      },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Search transactions (using text index)
Adminroute.get('/payin/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const transactions = await PayinTransaction.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// -----------------------all-payout---------------------------
// Get all transactions with pagination, filtering, and sorting
Adminroute.get('/all-payout', async (req, res) => {
  try {
     const allpayout=await PayoutTransaction.find();
     if(!allpayout){
      return res.send({success:false,message:"No Payout Found!"})
     }
     res.send({success:true,data:allpayout})
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

Adminroute.put('/change-payout-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    const transaction = await PayoutTransaction.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        statusDate: new Date(),
      },
      { new: true, runValidators: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
Adminroute.delete('/payout/:id', async (req, res) => {
  try {
    const transaction = await PayoutTransaction.findByIdAndDelete(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Filter payout transactions by date range
Adminroute.post('/payout-filter-by-date', async (req, res) => {
  try {
    const { startDate, endDate, transactionId } = req.body;

    // Validate input
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        message: 'Start date and end date are required' 
      });
    }

    // Convert dates to proper Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the entire end day

    // Build query
    const query = { 
      createdAt: { 
        $gte: start,
        $lte: end
      }
    };

    // Add transactionId filter if provided
    if (transactionId) {
      query.$or = [
        { paymentId: transactionId },
        { orderId: transactionId },
        { transactionId: transactionId }
      ];
    }

    // Fetch transactions
    const transactions = await PayoutTransaction.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    // Format response data to match what the frontend expects
    const formattedTransactions = transactions.map(txn => ({
      id: txn._id,
      date: txn.createdAt.toLocaleDateString(),
      amount: txn.requestAmount,
      currency: txn.currency,
      status: txn.status.charAt(0).toUpperCase() + txn.status.slice(1), // Capitalize first letter
      paymentId: txn.paymentId,
      orderId: txn.orderId,
      payeeAccount: txn.payeeAccount
    }));

    res.json({ 
      success: true,
      transactions: formattedTransactions 
    });

  } catch (error) {
    console.error('Error filtering transactions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while filtering transactions' 
    });
  }
});
// ---------------forwardms---------------------
Adminroute.get("/forward-sms",async(req,res)=>{
  try {
     const allsms=await ForwardedSms.find();
     if(!allsms){
      return res.send({success:false,message:"Do not have any message."})
     }
     res.send({success:true,data:allsms})
  } catch (error){
    console.log(error)
  }
})
Adminroute.delete("/forward-sms/:id",async(req,res)=>{
  try {
     const singlemesssage=await ForwardedSms.findByIdAndDelete({_id:req.params.id});
     if(!singlemesssage){
      return res.send({success:false,message:"Do not have any message."})
     }
     res.send({success:true,message:"Deleted successfully."})
  } catch (error){
    console.log(error)
  }
})

// ----------------total-analytics--------------------------------
const moment = require('moment');
const Merchantkey = require('../Models/Merchantkey');

Adminroute.get('/analytics', async (req, res) => {
  try {
    const { period = 'month', provider } = req.query;
    
    // Get date range based on period
    const now = moment();
    let start, end;
    
    switch(period) {
      case 'today':
        start = now.clone().startOf('day');
        end = now.clone().endOf('day');
        break;
      case 'month':
        start = now.clone().startOf('month');
        end = now.clone().endOf('month');
        break;
      case 'year':
        start = now.clone().startOf('year');
        end = now.clone().endOf('year');
        break;
      case 'all':
      default:
        start = moment(0); // beginning of time
        end = moment().endOf('day');
        break;
    }
    
    // Base match query
    const matchQuery = {
      createdAt: { $gte: start.toDate(), $lte: end.toDate() }
    };
    
    // Nagad-specific match query
    const nagadMatchQuery = {
      ...matchQuery,
      provider: /nagad/i // Case-insensitive regex for Nagad
    };
    
    // Add provider filter if specified
    if (provider) {
      matchQuery.provider = new RegExp(provider, 'i');
    }
    
    // Helper function to get the correct amount field based on payment type
    const getPayinAmountField = {
      $cond: {
        if: { $eq: ['$paymentType', 'p2c'] },
        then: '$expectedAmount',
        else: '$receivedAmount'
      }
    };
    
    // Execute all queries in parallel for better performance
    const [
      // General stats
      payinStats,
      payoutStats,
      pendingPayins,
      pendingPayinsAmount,
      completedPayins,
      completedPayinsAmount,
      rejectedPayins,
      rejectedPayinsAmount,
      pendingPayouts,
      pendingPayoutsAmount,
      successPayouts,
      successPayoutsAmount,
      rejectedPayouts,
      rejectedPayoutsAmount,
      payinTrend,
      payoutTrend,
      topPayinAccounts,
      topPayoutAccounts,
      
      // Nagad-specific queries
      nagadPayinStats,
      nagadPayoutStats,
      nagadPendingPayins,
      nagadPendingPayinsAmount,
      nagadCompletedPayins,
      nagadCompletedPayinsAmount,
      nagadRejectedPayins,
      nagadRejectedPayinsAmount,
      nagadPendingPayouts,
      nagadPendingPayoutsAmount,
      nagadSuccessPayouts,
      nagadSuccessPayoutsAmount,
      nagadRejectedPayouts,
      nagadRejectedPayoutsAmount,
      nagadPayinTrend,
      nagadPayoutTrend,
      nagadTopPayinAccounts,
      nagadTopPayoutAccounts
    ] = await Promise.all([
      // Payin stats by provider (completed only)
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField },
            avgAmount: { $avg: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      
      // Payout stats by provider (success only)
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' },
            avgAmount: { $avg: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } }
      ]),
      
      // Payin status counts and amounts
      PayinTransaction.countDocuments({ ...matchQuery, status: 'pending' }),
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...matchQuery, status: 'completed' }),
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...matchQuery, status: 'rejected' }),
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      
      // Payout status counts and amounts
      PayoutTransaction.countDocuments({ ...matchQuery, status: 'pending' }),
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...matchQuery, status: 'success' }),
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...matchQuery, status: 'rejected' }),
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      
      // Payin trend (completed only)
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Payout trend (success only)
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top payin accounts (completed only)
      PayinTransaction.aggregate([
        { $match: { ...matchQuery, status: 'completed' } },
        {
          $group: {
            _id: '$payerAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]),
      
      // Top payout accounts (success only)
      PayoutTransaction.aggregate([
        { $match: { ...matchQuery, status: 'success' } },
        {
          $group: {
            _id: '$payeeAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]),
      
      // Nagad-specific analytics
      // Nagad payin stats (completed only)
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField },
            avgAmount: { $avg: getPayinAmountField }
          }
        }
      ]),
      
      // Nagad payout stats (success only)
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        { 
          $group: {
            _id: '$provider',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' },
            avgAmount: { $avg: '$sentAmount' }
          }
        }
      ]),
      
      // Nagad payin status counts and amounts
      PayinTransaction.countDocuments({ ...nagadMatchQuery, status: 'pending' }),
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...nagadMatchQuery, status: 'completed' }),
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      PayinTransaction.countDocuments({ ...nagadMatchQuery, status: 'rejected' }),
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: getPayinAmountField } } }
      ]),
      
      // Nagad payout status counts and amounts
      PayoutTransaction.countDocuments({ ...nagadMatchQuery, status: 'pending' }),
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'pending' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...nagadMatchQuery, status: 'success' }),
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      PayoutTransaction.countDocuments({ ...nagadMatchQuery, status: 'rejected' }),
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'rejected' } },
        { $group: { _id: null, totalAmount: { $sum: '$sentAmount' } } }
      ]),
      
      // Nagad payin trend (completed only)
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Nagad payout trend (success only)
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        {
          $group: {
            _id: period === 'today' ? { $hour: '$createdAt' } : 
                 period === 'month' ? { $dayOfMonth: '$createdAt' } : 
                 { $month: '$createdAt' },
            count: { $sum: 1 },
            amount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Top Nagad payin accounts (completed only)
      PayinTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'completed' } },
        {
          $group: {
            _id: '$payerAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: getPayinAmountField }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ]),
      
      // Top Nagad payout accounts (success only)
      PayoutTransaction.aggregate([
        { $match: { ...nagadMatchQuery, status: 'success' } },
        {
          $group: {
            _id: '$payeeAccount',
            count: { $sum: 1 },
            totalAmount: { $sum: '$sentAmount' }
          }
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    // Extract amount totals from aggregation results
    const getAmount = (result) => result[0]?.totalAmount || 0;
    
    // Calculate totals for all transactions
    const totalPayinPendingAmount = getAmount(pendingPayinsAmount);
    const totalPayinCompletedAmount = getAmount(completedPayinsAmount);
    const totalPayinRejectedAmount = getAmount(rejectedPayinsAmount);
    const totalPayinAmount = totalPayinPendingAmount + totalPayinCompletedAmount + totalPayinRejectedAmount;
    
    const totalPayoutPendingAmount = getAmount(pendingPayoutsAmount);
    const totalPayoutSuccessAmount = getAmount(successPayoutsAmount);
    const totalPayoutRejectedAmount = getAmount(rejectedPayoutsAmount);
    const totalPayoutAmount = totalPayoutPendingAmount + totalPayoutSuccessAmount + totalPayoutRejectedAmount;
    
    // Calculate totals for Nagad transactions
    const totalNagadPayinPendingAmount = getAmount(nagadPendingPayinsAmount);
    const totalNagadPayinCompletedAmount = getAmount(nagadCompletedPayinsAmount);
    const totalNagadPayinRejectedAmount = getAmount(nagadRejectedPayinsAmount);
    const totalNagadPayinAmount = totalNagadPayinPendingAmount + totalNagadPayinCompletedAmount + totalNagadPayinRejectedAmount;
    
    const totalNagadPayoutPendingAmount = getAmount(nagadPendingPayoutsAmount);
    const totalNagadPayoutSuccessAmount = getAmount(nagadSuccessPayoutsAmount);
    const totalNagadPayoutRejectedAmount = getAmount(nagadRejectedPayoutsAmount);
    const totalNagadPayoutAmount = totalNagadPayoutPendingAmount + totalNagadPayoutSuccessAmount + totalNagadPayoutRejectedAmount;
    
    // Response data
    const analyticsData = {
      period: {
        start: start.toDate(),
        end: end.toDate(),
        name: period
      },
      totals: {
        // All transactions
        payin: {
          total: totalPayinAmount,
          completed: totalPayinCompletedAmount,
          pending: totalPayinPendingAmount,
          rejected: totalPayinRejectedAmount
        },
        payout: {
          total: totalPayoutAmount,
          success: totalPayoutSuccessAmount,
          pending: totalPayoutPendingAmount,
          rejected: totalPayoutRejectedAmount
        },
        net: totalPayinCompletedAmount - totalPayoutSuccessAmount,
        
        // Nagad-specific
        nagadPayin: {
          total: totalNagadPayinAmount,
          completed: totalNagadPayinCompletedAmount,
          pending: totalNagadPayinPendingAmount,
          rejected: totalNagadPayinRejectedAmount
        },
        nagadPayout: {
          total: totalNagadPayoutAmount,
          success: totalNagadPayoutSuccessAmount,
          pending: totalNagadPayoutPendingAmount,
          rejected: totalNagadPayoutRejectedAmount
        },
        nagadNet: totalNagadPayinCompletedAmount - totalNagadPayoutSuccessAmount
      },
      payin: {
        byProvider: payinStats,
        trend: payinTrend,
        topAccounts: topPayinAccounts
      },
      payout: {
        byProvider: payoutStats,
        trend: payoutTrend,
        topAccounts: topPayoutAccounts
      },
      nagad: {
        payin: {
          byProvider: nagadPayinStats,
          trend: nagadPayinTrend,
          topAccounts: nagadTopPayinAccounts
        },
        payout: {
          byProvider: nagadPayoutStats,
          trend: nagadPayoutTrend,
          topAccounts: nagadTopPayoutAccounts
        }
      },
      statusCounts: {
        payin: {
          pending: pendingPayins,
          completed: completedPayins,
          rejected: rejectedPayins
        },
        payout: {
          pending: pendingPayouts,
          success: successPayouts,
          rejected: rejectedPayouts
        }
      }
    };
    
    res.json({
      success: true,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment analytics',
      error: error.message
    });
  }
});


// -----------------------api-key-----------------------------------

// POST - Create new merchant
Adminroute.post('/merchant-key', async (req, res) => {
  try {
    const { name, email, websiteUrl } = req.body;
    
    const merchant = new Merchantkey({
      name,
      email,
      websiteUrl
    });

    await merchant.save();
    
    res.status(201).json({
      message: 'Merchant created successfully',
      merchant: {
        id: merchant._id,
        name: merchant.name,
        email: merchant.email,
        websiteUrl: merchant.websiteUrl,
        apiKey: merchant.apiKey
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email or API key already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT - Update merchant by ID
Adminroute.put('/merchant-key/:id', async (req, res) => {
  try {
    const { name, email, websiteUrl } = req.body;
    
    const merchant = await Merchantkey.findByIdAndUpdate(
      req.params.id,
      { name, email, websiteUrl },
      { new: true }
    );

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      message: 'Merchant updated successfully',
      merchant
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE - Remove merchant by ID
Adminroute.delete('/merchant-key/:id', async (req, res) => {
  try {
    const merchant = await Merchantkey.findByIdAndDelete(req.params.id);

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      message: 'Merchant deleted successfully',
      merchantId: req.params.id
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
Adminroute.get('/merchant-key', async (req, res) => {
  try {
    const merchant = await Merchantkey.find();

    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({
      message: 'Merchant successfully',
      merchant:merchant
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports = Adminroute;