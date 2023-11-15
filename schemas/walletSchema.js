const Joi = require('joi');

/**
 * Schema for wallet setup validation using Joi.
 * This schema is used to validate the data provided during the wallet setup process.
 * It ensures that the necessary fields are provided and conform to the expected formats and constraints.
 *
 * Fields:
 * - balance: A positive number with up to four decimal places, representing the initial balance of the wallet.
 * - name: A string representing the name of the wallet.
 *
 * The schema is configured to reject any unknown fields that are not explicitly defined here,
 * ensuring that only the specified fields are accepted.
 */
const walletSetupSchema = Joi.object({
    // The balance must be a positive number and is limited to four decimal places.
    balance: Joi.number().precision(4).positive().required(),

    // The name of the wallet, required as a string.
    name: Joi.string().required()
}).options({ allowUnknown: false }); // Configures the schema to reject unknown fields.

module.exports = walletSetupSchema;
