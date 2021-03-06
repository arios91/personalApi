const keys = require('./config/keys');
const stripe = require('stripe')(keys.stripeSecretKey);
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 8080;


const app = express();

var corsOptions = {
  origin: function (origin, callback) {
    if (keys.whiteList.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

//body parser parses incoming requests
app.use(bodyParser.json());

app.use(cors(corsOptions));

let transporter = nodemailer.createTransport({
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: keys.nodeMailerUser,
        pass: keys.nodeMailerPass
    },
    tls:{
        rejectUnauthorized: false
    }
});

app.get('/', (req, res) => {
    res.send('invalid endpoint TEST 3' + keys.orderInEmail);
});

app.get('/test', (req, res) =>{
    return 'hello world';
});

//contactEmail, use this to send emails to contact email address
app.post('/sendEmail', (req, res) =>{
    let recipientEmail = req.body.recipientEmail === 'contact' ? keys.orderInEmail : req.body.recipientEmail;

    // setup email data with unicode symbols
    let mailOptions = {
        from: req.body.customerEmail, // sender address
        to: recipientEmail, // list of receivers
        subject: req.body.subject, // Subject line
        text: req.body.textBody, // plain text body
        html: req.body.emailBody // html body
    };

    sendEmail(mailOptions);
    res.end();
});


//charge route
app.post('/charge', (req, res) =>{
    //create and charge the customer
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    })
    .then(customer => stripe.charges.create({
        amount: req.body.amount,
        description: req.body.description,
        currency: 'usd',
        customer: customer.id,
        receipt_email: req.body.email
    }))
    .then(charge => {
    // setup email data with unicode symbols
        let mailOptions = {
            from: keys.orderInSender, // sender address
            to: keys.orderInEmail, // list of receivers
            subject: 'Order In', // Subject line
            html: req.body.emailBody // html body
        };
        sendEmail(mailOptions)
        res.end();
    })
    .catch((err) => {
        console.log('error: ' + err);
    });
    res.end();
});

const sendEmail = (mailOptions) => {
    transporter.sendMail(mailOptions, error => {
        if (error) {
            return console.log(error);
        }
    });
}

app.listen(port, () => {
});