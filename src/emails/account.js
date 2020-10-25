const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendEmail = (msg) => {
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch(error => {
            console.log(error.body.errors)
        })
}

const sendWelcomeEmail = (email, name) => {
    const msg ={
        from: 'lahirukk01@gmail.com',
        to: email,
        subject: 'Thanks for joining us',
        text: `Welcome to the app,  ${name}. Let me know how you get along with the app`
    }

    sendEmail(msg)
}

const sendCancellationEmail = (email, name) => {
    const msg ={
        from: 'lahirukk01@gmail.com',
        to: email,
        subject: 'Sorry to see you go',
        text: `Good bye,  ${name}.`
    }

    sendEmail(msg)
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}

