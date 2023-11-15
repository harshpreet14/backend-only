const uuid = require('uuid');
const Wallet = require('../models/wallet');
const walletSetupSchema = require('../schemas/walletSchema');
const mongoose = require('mongoose');

/**
 * Setup a new wallet.
 * This function handles the creation of a new wallet, validating the request data,
 * creating unique IDs for the wallet and its initial transaction, and saving the wallet to the database.
 *
 * @param {object} req - The request object containing the wallet setup data.
 * @param {object} res - The response object used to return the created wallet data.
 */
exports.setupWallet = async (req, res) => {
    try {
        // Validate the request body against the schema
        // Throws an error if the validation fails
        const validatedData = await walletSetupSchema.validateAsync(req.body);

        // Check if a wallet with the same username already exists
        const existingWallet = await Wallet.findOne({ name: validatedData.name });

        if (existingWallet) {
            // If a wallet with the same username exists, return a message
            return res.status(200).json({
                message: `You already have a wallet with ${existingWallet.name}`,
                id: existingWallet._id,
                balance: existingWallet.balance,
                name: existingWallet.name,
                date: existingWallet.date
            });
        }else {
            // Generate unique IDs for the wallet and the initial transaction
            const walletId = uuid.v4();
            const transactionId = uuid.v4();

            // Create a new wallet instance with the validated data and initial credit transaction
            const newWallet = new Wallet({
                _id: walletId,
                balance: validatedData.balance,
                name: validatedData.name,
                message: "New Wallet Created",
                transactions: [{
                    id: transactionId,
                    date: new Date(),
                    amount: validatedData.balance,
                    type: 'CREDIT' // Initial balance is always credited
                }]
            });

            // Save the wallet instance to the database
            await newWallet.save();

            // Respond with the newly created wallet details
            res.status(200).json({
                id: walletId,
                balance: validatedData.balance,
                transactionId,
                name: validatedData.name,
                date: newWallet.date // The creation date of the wallet
            });
        }

    } catch (error) {
        // Log and respond with any errors encountered during wallet setup
        console.error('Setup Wallet Error:', error.message); // Basic logging
        res.status(400).json({ error: error.message });
    }
};



/**
 * Handles credit or debit transactions on a wallet.
 * This function manages the transaction process, ensuring the wallet exists and has sufficient funds for debit operations.
 * It uses MongoDB transactions to ensure atomicity in database operations.
 *
 * @param {object} req - The request object from Express, containing the wallet ID in the parameters and transaction details in the body.
 * @param {object} res - The response object from Express, used to send back the result of the transaction operation.
 */
exports.transact = async (req, res) => {
    const { walletId } = req.params; // Extract walletId from the request parameters
    const { amount, description } = req.body; // Extract amount and description from the request body

    // Start a new session for MongoDB transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Fetch the wallet by ID with the transaction session
        const wallet = await Wallet.findById(walletId).session(session);
        if (!wallet) {
            throw new Error('Wallet not found'); // Wallet must exist to proceed
        }

        // Check for sufficient funds in case of a debit transaction
        if (amount < 0 && wallet.balance + amount < 0) {
            return res.status(400).json({ message: 'Insufficient funds' }); // Return 400 for insufficient funds
        }
        if(amount === 0){
            return res.status(400).json({ message: 'Invalid amount entered' }); // Return 400 for invalid amount
        }

        // Update wallet balance and add the new transaction
        wallet.balance += amount;
        wallet.transactions.push({
            id: uuid.v4(), // Generate a unique ID for the transaction
            date: new Date(), // Current date and time
            amount,
            type: amount >= 0 ? 'CREDIT' : 'DEBIT', // Determine transaction type
            description
        });

        // Save the updated wallet and commit the transaction
        await wallet.save();
        await session.commitTransaction();
        session.endSession();

        // Send back the updated wallet balance and transaction ID
        res.status(200).json({
            balance: wallet.balance,
            transactionId: wallet.transactions[wallet.transactions.length - 1].id
        });
    } catch (error) {
        // In case of error, abort the transaction and log the error
        await session.abortTransaction();
        session.endSession();
        console.error('Transaction Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Fetches a paginated list of transactions for a specific wallet.
 * This function retrieves transactions based on the wallet ID provided in the query parameters.
 * It supports pagination through 'skip' and 'limit' query parameters.
 *
 * @param {object} req - The request object from Express, containing query parameters for wallet ID, skip, and limit.
 * @param {object} res - The response object from Express, used to send back the transaction data.
 */
exports.fetchTransactions = async (req, res) => {
    const { walletId } = req.query; // Extract walletId from the query parameters
    const skip = Math.max(0, parseInt(req.query.skip) || 0); // Determine number of transactions to skip (for pagination)
    const limit = Math.max(1, parseInt(req.query.limit) || 10); // Determine limit of transactions to fetch

    try {
        // Retrieve the wallet and apply slicing for pagination
        const wallet = await Wallet.findById(walletId, { transactions: { $slice: [skip, limit]} });
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' }); // Wallet must exist to proceed
        }

        // Process transactions to confirm to the OpenAPI spec
        // Maps each transaction to include only the specified fields
        const processedTransactions = wallet.transactions.map(transaction => {
            const { id, date, amount, description, type } = transaction;
            return { id, walletId, date, amount, description, type }; // Exclude MongoDB's internal _id field
        });

        // Send back the array of processed transactions
        res.status(200).json(processedTransactions);
    } catch (error) {
        // Log and respond with any errors encountered during fetching transactions
        console.error('Fetch Transactions Error:', error.message);
        res.status(500).json({ error: 'Error fetching transactions' });
    }
};


/**
 * Retrieves the details of a specific wallet by its ID.
 * Validates the wallet ID to ensure it is in the correct UUID format before fetching the wallet.
 * If the wallet is found, its details are returned; otherwise, appropriate error messages are sent.
 *
 * @param {object} req - The request object from Express, containing the wallet ID in the parameters.
 * @param {object} res - The response object from Express, used to send back the wallet details or an error message.
 */
exports.getWalletDetails = async (req, res) => {
    const { id } = req.params; // Extract wallet ID from the request parameters

    // Regular expression for UUID format validation
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
        return res.status(400).json({ error: 'Invalid wallet ID format' }); // Respond with error if ID format is invalid
    }

    try {
        // Fetch the wallet by its ID from the database
        const wallet = await Wallet.findById(id);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' }); // Respond with error if wallet is not found
        }

        // Format the creation date of the wallet
        const formattedDate = wallet.date.toISOString().substring(0, 10); // Format the date to YYYY-MM-DD

        // Respond with the wallet details
        res.status(200).json({
            id: wallet._id,   // Wallet ID
            balance: wallet.balance, // Current balance of the wallet
            name: wallet.name, // Name of the wallet
            date: formattedDate,
            total: wallet.transactions.length // Creation date of the wallet
        });
    } catch (error) {
        // Log and respond with any errors encountered during fetching wallet details
        console.error('Get Wallet Details Error:', error.message);
        res.status(500).json({ error: 'Error fetching wallet details' }); // Respond with error in case of a server issue
    }
};