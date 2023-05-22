const Web3 = require('web3');
const MongoClient = require('mongodb').MongoClient;

// MongoDB configuration
const mongoURI = 'mongodb://localhost:27017'; // Replace with your MongoDB URI
const dbName = 'bitbank'; // Replace with your database name
const collectionName = 'exchange'; // Replace with your collection name

// Ethereum network configuration
const web3 = new Web3('https://erpc.apothem.network'); // Replace with your Infura project ID or Ethereum node URL
const contractAddress = '0x2f78fc77fF3DfeFD469af6e21D2d1ad84216BC9c'; // Replace with your smart contract address
const exchangeABI = require("./abi/bitbank.json"); // Replace with your smart contract ABI

// Connect to MongoDB and Ethereum network
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

// Store event data in MongoDB
async function storeEvent(collection, eventData) {
  try {
    await collection.insertOne(eventData);
    console.log('Event data stored successfully:', eventData);
  } catch (error) {
    console.error('Error storing event data:', error);
  }
}

// Start the event listener
initialize().catch(console.error);