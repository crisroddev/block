# Private Blockchain

__Dependencies__
1. bitcoinjs-lib and bitcoinjs-message will help us verify wallet address ownership and signatures. 
2. express is a node framework used to create The REST Api used in this project
3. body-parser is used as a middleware module for Express and will help us to read the json data submitted in a POST request.
4. crypto-js is a module containing some of the most important cryptographic methods and will help us create the block hash.
5. hex2ascii will help us decode the data saved in the body of a Block.

__Sign__
* For getting address --> window --> console --> `getnewaddress "Label"`