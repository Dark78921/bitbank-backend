const express = require('express');
const { MongoClient } = require('mongodb');
const Web3 = require('web3');

const app = express();
const port = 3000; // Replace with your desired port number

const mongoURI = 'mongodb+srv://haraki:Bethebest123!@cluster0.bgr1lex.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB URI
const dbName = 'bitbank'; // Replace with your database name
const collectionName = 'exchagne'; // Replace with your collection name

const web3 = new Web3(new Web3.providers.HttpProvider('https://erpc.apothem.network'));
const exchangeAddress = '0x2f78fc77fF3DfeFD469af6e21D2d1ad84216BC9c'; // Replace with your smart contract address
const exchangeABI = require('./abi/bitbank.json'); // Replace with your smart contract ABI

async function initialize() {
    const exchangeContract = new web3.eth.Contract(exchangeABI, exchangeAddress);

    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const blockNumber = await web3.eth.getBlockNumber();
    let latestBlock = blockNumber;

    setInterval(async () => {
        const currentBlock = await web3.eth.getBlockNumber();
        if (currentBlock > latestBlock) {
            const events = await exchangeContract.getPastEvents('SynthExchange', {
                fromBlock: latestBlock + 1,
                toBlock: currentBlock
            });

            events.forEach(async (event) => {
                try {
                    await collection.insertOne(event.returnValues);
                    console.log('Event data stored successfully:', event.returnValues);
                } catch (error) {
                    console.error('Error storing event data:', error);
                }
            });

            latestBlock = currentBlock;
        }
    }, 5000); // Polling interval in milliseconds (e.g., 5000 ms = 5 seconds)
}

initialize().catch(console.error);

app.get('/exchange', async (req, res) => {
    try {
        const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const data = await collection.find().toArray();
        res.json(data);

        client.close();
    } catch (error) {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
