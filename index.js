

const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const { SendSmtpEmail } = SibApiV3Sdk;//This line extracts the SendSmtpEmail class from the SibApiV3Sdk module

// Initialize the Express.js app
const app = express();// an instance of the Express.js app is created, and the bodyParser middleware is added to parse incoming JSON data.
app.use(bodyParser.json());

// Connect to MongoDB
const mongoClient = new MongoClient('', {
  useNewUrlParser: true,//A new MongoClient instance is created, connecting to a MongoDB cluster using the specified connection string.
  useUnifiedTopology: true,
});

// Connect to SendinBlue API
const username = encodeURIComponent('cosmos');//Here, the SendinBlue API client is initialized. The apiKey is set to authenticate the client.
const password = encodeURIComponent('cosmosTM');
const sendinBlueClient = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = sendinBlueClient.apiClient.authentications['api-key'];
apiKey.apiKey = '';

// Define a route to trigger sending an email
app.post('/send-email', async (req, res) => {//This defines a route (/send-email) that handles HTTP POST requests. The route is asynchronous, using the async keyword.
  try {
    const { recipientEmail, subject, body } = req.body;//This line uses destructuring assignment to extract recipientEmail, subject, and body from the req.body object.

    // Save the email data in MongoDB (optional)
    await mongoClient.connect();//Here, a connection to the MongoDB server is established using mongoClient.connect(). Then, a database (cosmosTM) and a collection (emails) are accessed. An email document is
    // inserted into the collection, including the recipient's email, subject, body, and the current timestamp.
    const db = mongoClient.db('cosmosTM');
    const collection = db.collection('emails');
    await collection.insertOne({
      recipientEmail,
      subject,
      body,
      sentAt: new Date(),
    });

    // Send the email using SendinBlue
    const sendSmtpEmail = new SendSmtpEmail();//An instance of SendSmtpEmail is created and configured with the subject, text content, sender information, and recipient email.
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.textContent = body;
    sendSmtpEmail.sender = { name: '', email: '' };
    sendSmtpEmail.to = [{ email: recipientEmail }];

    console.log(apiKey.apiKey);//This line logs the value of the SendinBlue API key to the console. It can be useful for debugging purposes or verifying that the API key is correctly set

    const response = await sendinBlueClient.sendTransacEmail(sendSmtpEmail);//The sendTransacEmail method of the SendinBlue client is called to send the configured email (sendSmtpEmail).
    console.log('Email sent:', response);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Start the server
app.listen(587, () => {
  console.log('Server is running on port 587');
});


