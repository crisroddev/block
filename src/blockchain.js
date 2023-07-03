/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message` 
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *  
 */

const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

class Blockchain {

    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if( this.height === -1){
            let block = new BlockClass.Block({data: 'Genesis Block'});
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block 
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to 
     * create the `block hash` and push the block into the chain array. Don't for get 
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention 
     * that this method is a private method. 
     */
    _addBlock(block) {
        return new Promise(async (resolve, reject) => {
            // New Block height
            block.height = this.height + 1;
            // Adding timestamp
            block.time = new Date().getTime().toString().slice(0, -3);
            // If previousBlockHash
            if(this.chain > 0){
                block.previousBlockHash = this.chain[this.height].hash;
            }
            // Hash value for new block
            block.hash = SHA256(JSON.stringify(block)).toString();
            // Block to chain
            this.chain.push(block);
            // Update height
            this.height += 1;

            if(this.chain[this.height] == block){
                resolve(block);
            } else {
                reject(new Error('No block was added'))
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address 
     */
    requestMessageOwnershipVerification(address) {
        return Promise.resolve(`${address} : ${new Date().getTime().toString().slice(0, -3)}:starRegistry`);
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address 
     * @param {*} message 
     * @param {*} signature 
     * @param {*} star 
     */
    async submitStar(address, message, signature, star) {
        const time = parseInt(message.split(':')[1]);
        const currentTime = Date.now();
    
        if (time > currentTime - 300000) {
            if(bitcoinMessage.verify(message,address,signature,null,true)){
                let block = new BlockClass.Block({
                    "owner": address,
                    "start": star
                });
                await this._addBlock(block);
                return block;
            } else {
                return new Error('Message not verified');
            }
        } else {
            return new Error('Timeout')
        }
    }
    

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash 
     */
    getBlockByHash(hash) {
        return new Promise((resolve, reject) => {
            let block = this.chain.filter(p => p.hash === hash)[0];
            if(block) {
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object 
     * with the height equal to the parameter `height`
     * @param {*} height 
     */
    getBlockByHeight(height) {
        return new Promise((resolve, reject) => {
            let block = this.chain.filter(p => p.height === height)[0];
            if(block){
                resolve(block);
            } else {
                resolve(null);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain 
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address 
     */
    getStarsByWalletAddress(address) {
        const stars = [];
        return new Promise((resolve, reject) => {
            (async () => {
                for (const block of this.chain) {
                    const data = await block.getBData();
                    if (data.owner === address) {
                        stars.push(data);
                    }
                }
                resolve(stars);
            })().catch(reject);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        const errorLog = [];
        return new Promise((resolve, reject) => {
            if (this.height > 0) {
                (async () => {
                    for (let i = 1; i <= this.height; i++) {
                        const block = this.chain[i];
                        const isValid = await block.validate();
                        if (!isValid) {
                            errorLog.push("ERROR VALIDATING DATA");
                        } else if (block.previousBlockHash !== this.chain[i - 1].hash) {
                            errorLog.push("ERROR WITH PREVIOUS BLOCK HASH");
                        }
                    }
                    if (errorLog.length === 0) {
                        resolve("Chain is valid.");
                    } else {
                        resolve(errorLog);
                    }
                })().catch(reject);
            } else {
                reject(new Error("Cannot validate chain."));
            }
        });
    }

}

module.exports.Blockchain = Blockchain;   