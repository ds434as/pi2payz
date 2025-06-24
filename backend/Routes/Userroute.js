const express = require('express');
const UserModel = require('../Models/User');
const { authenticate, authorizeAdmin, authorizeuser } = require('../Middlewares/authMiddleware');
const PrepaymentRequest = require('../Models/PrepaymentRequest');
const BankAccount = require('../Models/BankAccount');
const PayinTransaction = require('../Models/PayinTransaction');
const PayoutTransaction = require('../Models/PayoutTransaction');
const Userrouter = express.Router();


Userrouter.use(authenticate);
Userrouter.use(authorizeuser);

// ----------------------------dashboard----------------------------
// ----------------------------dashboard----------------------------
Userrouter.get("/dashboard-data/:id", async (req, res) => {
  try {
    // Get all bank accounts for the user
    const all_bankaccounts = await BankAccount.find({ user_id: req.params.id });
    
    // Get all payin transactions for the user
    const all_payin = await PayinTransaction.find({ userid: req.params.id });
    
    // Get all payout transactions assigned to the user (assuming they're an agent)
    const all_payout = await PayoutTransaction.find({ assignedAgent: req.params.id });
    
    // Calculate totals for bank accounts
    const bankAccountsSummary = all_bankaccounts.reduce((acc, account) => {
      acc.totalAccounts += 1;
      acc.activeAccounts += account.status === 'active' ? 1 : 0;
      acc.totalReceived += account.total_recieved || 0;
      acc.totalPayouts += account.total_payoutno || 0;
      acc.totalCashout += account.total_cashout || 0;
      return acc;
    }, {
      totalAccounts: 0,
      activeAccounts: 0,
      totalReceived: 0,
      totalPayouts: 0,
      totalCashout: 0
    });
    
    // Calculate payin transaction statistics
    const payinStats = all_payin.reduce((acc, transaction) => {
      acc.totalTransactions += 1;
      acc.totalAmount += transaction.receivedAmount || 0;
      
      if (transaction.status === 'completed') {
        acc.completedTransactions += 1;
        acc.completedAmount += transaction.receivedAmount || 0;
      } else if (transaction.status === 'pending') {
        acc.pendingTransactions += 1;
        acc.pendingAmount += transaction.expectedAmount || 0;
      } else if (transaction.status === 'rejected') {
        acc.rejectedTransactions += 1;
      }
      
      return acc;
    }, {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      completedAmount: 0,
      pendingTransactions: 0,
      pendingAmount: 0,
      rejectedTransactions: 0
    });
    
    // Calculate payout transaction statistics
    const payoutStats = all_payout.reduce((acc, transaction) => {
      acc.totalTransactions += 1;
      acc.totalAmount += transaction.requestAmount || 0;
      
      if (transaction.status === 'success') {
        acc.completedTransactions += 1;
        acc.completedAmount += transaction.requestAmount || 0;
      } else if (transaction.status === 'pending') {
        acc.pendingTransactions += 1;
        acc.pendingAmount += transaction.requestAmount || 0;
      } else if (transaction.status === 'rejected' || transaction.status === 'reassigned') {
        acc.rejectedTransactions += 1;
      }
      
      return acc;
    }, {
      totalTransactions: 0,
      totalAmount: 0,
      completedTransactions: 0,
      completedAmount: 0,
      pendingTransactions: 0,
      pendingAmount: 0,
      rejectedTransactions: 0
    });
    
    // Recent transactions (last 5 of each type)
    const recentPayins = all_payin
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(tx => ({
        id: tx._id,
        amount: tx.receivedAmount || tx.expectedAmount,
        account: tx.payerAccount,
        status: tx.status,
        date: tx.createdAt,
        type: 'payin'
      }));
    
    const recentPayouts = all_payout
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(tx => ({
        id: tx._id,
        amount: tx.requestAmount,
        account: tx.payeeAccount,
        status: tx.status,
        date: tx.createdAt,
        type: 'payout'
      }));
    
    // Combine recent transactions and sort by date
    const recentTransactions = [...recentPayins, ...recentPayouts]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
    
    // Prepare the response
    const dashboardData = {
      summary: {
        bankAccounts: bankAccountsSummary,
        payin: payinStats,
        payout: payoutStats
      },
      recentTransactions,
      bankAccounts: all_bankaccounts.map(account => ({
        id: account._id,
        provider: account.provider,
        accountNumber: account.accountNumber,
        status: account.status,
        walletType: account.walletType,
        totalReceived: account.total_recieved,
        totalPayouts: account.total_payoutno
      }))
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
});
Userrouter.get("/single-user/:id", async (req, res) => {
    try {
        const user = await UserModel.findById({ _id: req.params.id });
        if (!user) {
            return res.send({ success: false, message: "User not found." });
        }
        res.send({ success: true, user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: "Server error." });
    }
});

// --------------prepayment-request--------------------
// Create new prepayment request
Userrouter.post('/prepayment-request', async (req, res) => {
  try {
    const {
      username,
      email,
      paymentMethod,
      currency,
      currentBalance,
      requestAmount,
      paidAmount,
      channel,
      note,
      requestDate,
      updateDate,
      status,
      userid
    } = req.body;

    const newRequest = new PrepaymentRequest({
      username,
      email,
      paymentMethod,
      currency,
      currentBalance,
      requestAmount,
      paidAmount,
      channel,
      note,
      requestDate,
      updateDate,
      userid,
      status:"Pending"
    });

    await newRequest.save();
    res.status(201).json(newRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 🔐 Get all prepayment requests for the logged-in user
Userrouter.get('/my-requests/:email', async (req, res) => {
  try {
   const email = req.user.email;
    const requests = await PrepaymentRequest.find({ email }).sort({ requestDate: -1 });
    res.json(requests);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});
// 🔍 Get requests by date range for logged-in user
Userrouter.get('/my-requests/filter', async (req, res) => {
  try {
    const email = req.user.email;
    const { startDate, endDate } = req.query;

    const query = {
      email,
      requestDate: {}
    };

    if (startDate) query.requestDate.$gte = new Date(startDate);
    if (endDate) query.requestDate.$lte = new Date(endDate);

    // Clean up empty $gte/$lte if not provided
    if (!startDate) delete query.requestDate.$gte;
    if (!endDate) delete query.requestDate.$lte;
    if (Object.keys(query.requestDate).length === 0) delete query.requestDate;

    const filteredRequests = await PrepaymentRequest.find(query).sort({ requestDate: -1 });
    res.json(filteredRequests);
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Failed to filter requests' });
  }
});
// -------------------add-bank-account----------------------
Userrouter.post('/add-bank-account', async (req, res) => {
  try {
    const { provider, accountNumber, shopName, walletType, isDefault } = req.body;
    const userId = req.user._id; // Assuming you have user info from authentication
    
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

    // Check if account number already exists for this user
    const user = await UserModel.findOne({
      _id: userId,
      'agentAccounts.accountNumber': accountNumber
    });
    
    if (user) {
      return res.status(400).json({ 
        success: false, 
        message: 'An account with this number already exists for this user' 
      });
    }

    // Check if P2C method has required fields
    if (provider === 'Bkash P2C') {
      if (!req.body.username || !req.body.password || !req.body.appKey || !req.body.appSecretKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'For Bkash P2C, username, password, appKey, and appSecretKey are required' 
        });
      }
    }

    if (provider === 'Nagad P2C') {
      if (!req.body.publicKey || !req.body.privateKey) {
        return res.status(400).json({ 
          success: false, 
          message: 'For Nagad P2C, publicKey and privateKey are required' 
        });
      }
    }

    // Check if wallet type is required
    if ((provider === 'Bkash P2P' || provider === 'Nagad P2P') && !walletType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wallet type is required for P2P methods' 
      });
    }

    // Prepare the new agent account data
    const newAccount = {
      provider,
      accountNumber,
      shopName,
      walletType: walletType || '',
      status: 'inactive', // default status
      isDefault: isDefault || false,
      ...req.body
    };

    // Add the new account to the user's agentAccounts array
    const user_account=await UserModel.findById({_id:userId})
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        $push: {
          agentAccounts: newAccount
        }
      },
      { new: true }
    );

    // If this account is set as default, update all other accounts to not be default
    if (isDefault) {
      await UserModel.updateOne(
        { 
          _id: userId,
          'agentAccounts._id': { $ne: updatedUser.agentAccounts[updatedUser.agentAccounts.length - 1]._id }
        },
        {
          $set: {
            'agentAccounts.$[].isDefault': false
          }
        }
      );
    }
       user_account.totalwallet+=1;
       user_account.save();
    // Get the newly added account (last one in the array)
    const addedAccount = updatedUser.agentAccounts[updatedUser.agentAccounts.length - 1];
// Create new bank account
    const bankAccount = new BankAccount({
      user_id: req.user._id,
      ...req.body
    });

    await bankAccount.save();
    res.status(201).json({
      success: true,
      message: 'Bank account added successfully',
      data: addedAccount
    });

  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while adding the bank account',
      error: error.message 
    });
  }
});


// Get a single bank account
Userrouter.get('/user-bank-account/:id', async (req, res) => {
  try {
    const bankAccount = await BankAccount.find({ 
      user_id: req.params.id 
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


// Get a single bank account
Userrouter.get('/bank-account/:id', async (req, res) => {
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
Userrouter.put('/update-bank-account/:id',async (req, res) => {
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


// ---------------filter-payin----------------------------
// Filter Payin transactions
Userrouter.post('/filter-transaction', async (req, res) => {
  try {
    const { paymentId, trxId } = req.body;

    if (!paymentId && !trxId) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter (paymentId or trxId) is required'
      });
    }

    // Build query dynamically based on provided parameters
    const query = {};
    if (paymentId) query.paymentId = paymentId;
    if (trxId) query.transactionId = trxId;

    const transactions = await PayinTransaction.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean();

    return res.json({
      success: true,
      transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Error filtering transactions:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
// Filter Payin transactions by date range
Userrouter.post('/filter-by-date', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both start date and end date are required'
      });
    }

    // Convert dates to proper Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end day

    // Query for transactions within date range
    const transactions = await PayinTransaction.find({
      createdAt: {
        $gte: start,
        $lte: end
      },
      status: 'completed' // Only show pending transactions for approval
    })
    .sort({ createdAt: -1 }) // Newest first
    .lean()
    .select('createdAt receivedAmount status paymentId transactionId'); // Only select needed fields

    // Format the response
    const formattedTransactions = transactions.map(txn => ({
      id: txn._id,
      date: txn.createdAt.toLocaleDateString(),
      amount: txn.receivedAmount,
      status: txn.status,
      paymentId: txn.paymentId,
      transactionId: txn.transactionId
    }));

    return res.json({
      success: true,
      transactions: formattedTransactions,
      count: formattedTransactions.length
    });

  } catch (error) {
    console.error('Error filtering by date:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// --------------------bank-account---------------------
Userrouter.get("/bank-accunts/:id",async(req,res)=>{
  try {
    const bankaccount=await BankAccount.find({user_id:req.params.id});
    if(!bankaccount){
      return res.send({success:false,message:"Account not found."})
    }
    res.send({success:true,data:bankaccount})
  } catch (error) {
    console.log(error)
  }
})
module.exports = Userrouter;