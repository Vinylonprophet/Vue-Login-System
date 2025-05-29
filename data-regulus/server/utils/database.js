const { client } = require('../config/database');
const { feishuPost } = require('../services/feishu');

async function connectToDB() {
  try {
    await client.connect();
    feishuPost('Connected successfully to MongoDB');
    console.log('Connected successfully to MongoDB');
  } catch (error) {
    await client.close();
    feishuPost(error);
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
