const express = require('express');
const { MongoClient } = require('mongodb');
const Web3 = require('web3');

const app = express();
const port = 5000; // Replace with your desired port number

const mongoURI = 'mongodb+srv://haraki:Bethebest123!@cluster0.bgr1lex.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB URI
const dbName = 'bitbank'; // Replace with your database name
const collectionName = 'exchange'; // Replace with your collection name

const web3 = new Web3(new Web3.providers.HttpProvider('https://erpc.apothem.network', { timeout: 10000 }));
const exchangeAddress = '0x2f78fc77fF3DfeFD469af6e21D2d1ad84216BC9c';
const exchangeRatesAddress = "0x9739146C93a21277F84B8cf60422E9C7f3e0BBF9";
const exchangeABI = require('./abi/bitbank.json'); // Replace with your smart contract ABI
const exchangeRatesABI = require("./abi/exchangeRates.json");

async function initialize() {
    const exchangeContract = new web3.eth.Contract(exchangeABI, exchangeAddress);
    const exchangeRatesContract = new web3.eth.Contract(exchangeRatesABI, exchangeRatesAddress);

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
                    let ratesData = await exchangeRatesContract.methods.effectiveValueAndRates(event.returnValues.fromCurrencyKey, event.returnValues.fromAmount, event.returnValues.toCurrencyKey).call();
                    let fromAmountInUSD = event.returnValues.fromAmount * ratesData.sourceRate / 10 ** 36;
                    let toAmountInUSD = event.returnValues.toAmount  * ratesData.destinationRate / 10 ** 36;
                    let timestamp = new Date();
                    timestamp = Math.floor(timestamp / 1000);
                    let data ={
                        account: event.returnValues.account,
                        fromSynth: {
                            symbol: web3.utils.toAscii(event.returnValues.fromCurrencyKey),
                        },
                        fromAmount: event.returnValues.fromAmount / 10 ** 18,
                        fromAmountInUSD: fromAmountInUSD,
                        toSynth: {
                            symbol: web3.utils.toAscii(event.returnValues.toCurrencyKey),
                        },
                        toAmount: event.returnValues.toAmount / 10 ** 18,
                        toAmountInUSD: toAmountInUSD,
                        feesInUSD: fromAmountInUSD - toAmountInUSD,
                        hash: event.transactionHash,
                        timestamp: timestamp
                    }
                    await collection.insertOne(data);
                    console.log('Event data stored successfully:', data);
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
        const { account } = req.query;
        const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        const query = { account : account };

        const data = await collection.find(query).toArray();
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
