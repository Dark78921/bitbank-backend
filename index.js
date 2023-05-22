const express = require('express');
const { MongoClient } = require('mongodb');
const Web3 = require('web3');

const app = express();
const port = 3000; // Replace with your desired port number

const mongoURI = 'mongodb+srv://haraki:Bethebest123!@cluster0.bgr1lex.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB URI
const dbName = 'bitbank'; // Replace with your database name
const collectionName = 'exchange'; // Replace with your collection name

// const web3 = new Web3('https://erpc.apothem.network'); // Replace with your Infura project ID or Ethereum node URL
const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://ws.apothem.network/ws'));
const contractAddress = '0x2f78fc77fF3DfeFD469af6e21D2d1ad84216BC9c'; // Replace with your smart contract address
const exchangeABI = require("./abi/bitbank.json"); // Replace with your smart contract ABI

app.get('/exchange', async (req, res) => {
  try {
    const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const data = await collection.find().toArray();
    res.json(data);

    await client.close();
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Failed to retrieve data' });
  }
});

async function initialize() {
  const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  const contract = new web3.eth.Contract(exchangeABI, contractAddress);

  contract.events.SynthExchange((error, event) => {
    if (error) {
      console.error('Error:', error);
    } else {
      const eventData = event.returnValues;
      storeEvent(collection, eventData);
    }
  });
}

async function storeEvent(collection, eventData) {
  try {
    await collection.insertOne(eventData);
    console.log('Event data stored successfully:', eventData);
  } catch (error) {
    console.error('Error storing event data:', error);
  }
}

initialize().catch(console.error);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
