const mongoose = require('mongoose');
const uuid = require('uuid');

const transactionSchema = new mongoose.Schema({
    id: { type: String, required: true, default: () => mongoose.Types.ObjectId().toString() },
    date: { type: Date, default: Date.now },
    amount: { type: Number, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true }
});

const walletSchema = new mongoose.Schema({
    _id: { type: String, required: true, default: () => uuid.v4() },
    balance: { type: Number, required: true },
    name: { type: String, required: true },
    transactions: [transactionSchema],
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wallet', walletSchema);
