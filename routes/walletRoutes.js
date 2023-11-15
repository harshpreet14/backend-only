const express = require('express');
const walletController = require('../controllers/walletController');

const router = express.Router();

// Route for setting up a new wallet
router.post('/setup', walletController.setupWallet);

// Route for credit/debit transaction
router.post('/transact/:walletId', walletController.transact);

// Route for fetching transactions
router.get('/transactions', walletController.fetchTransactions);

// Route for fetching wallet details
router.get('/wallet/:id', walletController.getWalletDetails);

module.exports = router;
