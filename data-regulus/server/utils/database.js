const { client } = require('../config/database');

async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
  } catch (error) {
    await client.close();
    console.error('Error connecting to MongoDB:', error);
  }
}

process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
    process.exit(1);
  }
});

module.exports = {
  connectToDB
};
