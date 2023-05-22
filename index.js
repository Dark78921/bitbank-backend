const express = require('express');
const { MongoClient } = require('mongodb');
const Web3 = require('web3');

const app = express();
const port = 3000; // Replace with your desired port number

const mongoURI = 'mongodb+srv://haraki:Bethebest123!@cluster0.bgr1lex.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB URI
const dbName = 'bitbank'; // Replace with your database name
const collectionName = 'exchagne'; // Replace with your collection name

const providerUrl = 'https://erpc.apothem.network'; // Replace with your Infura project ID or provider URL
const contractAddress = '0x2f78fc77fF3DfeFD469af6e21D2d1ad84216BC9c'; // Replace with your smart contract address
const contractABI = require('./abi/bitbank.json'); // Replace with your smart contract ABI

async function initialize() {
  const provider = new Web3.providers.HttpProvider(providerUrl);
  const web3 = new Web3(provider);
  const contract = new web3.eth.Contract(contractABI, contractAddress);

  const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();

  const db = client.db(dbName);
  const collection = db.collection(collectionName);

  contract.events.SynthExchange({}, async (error, event) => {
    if (error) {
      console.error('Error capturing event:', error);
      return;
    }

    try {
      await collection.insertOne(event.returnValues);
      console.log('Event data stored successfully:', event.returnValues);
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
