const sgMail = require('@sendgrid/mail');

// setting up the api key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (name, email) => {
    sgMail.send({
        to: email,
        from: 'ashwinraut12345@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to task-manager, ${name}. Let me know how you get along!`
    }).then().catch(e => {
        console.log(e);
    });
}

sendCancelationEmail = (name, email) => {
    sgMail.send({
        to: email,
        from: 'ashwinraut12345@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon.`
    }).then().catch(e => {
        console.log(e);
    });
};

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
};
