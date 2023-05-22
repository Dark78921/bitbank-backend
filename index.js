const express = require('express');
const { MongoClient } = require('mongodb');
const { ethers } = require('ethers');

const app = express();
const port = 3000; // Replace with your desired port number

const mongoURI = 'mongodb+srv://haraki:Bethebest123!@cluster0.bgr1lex.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB URI
const dbName = 'bitbank'; // Replace with your database name
const collectionName = 'exchagne'; // Replace with your collection name

const providerUrl = 'https://erpc.apothem.network'; // Replace with your Infura project ID or provider URL
const contractAddress = '0x2f78fc77fF3DfeFD469af6e21D2d1ad84216BC9c'; // Replace with your smart contract address
const exchangeABI = require("./abi/bitbank.json"); // Replace with your smart contract ABI

async function initialize() {
  const provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const contract = new ethers.Contract(contractAddress, exchangeABI, provider);

  const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  contract.on('SynthExchange', async (eventData) => {
    try {
      await collection.insertOne(eventData);
      console.log('Event data stored successfully:', eventData);
    } catch (error) {
      console.error('Error storing event data:', error);
    }
  });
}

initialize().catch(console.error);

app.get('/data', async (req, res) => {
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
