const express = require('express');
const path = require('path');
const fs = require('fs').promises
const {authenticate} = require("@google-cloud/local-auth");
const {google} = require("googleapis")

const app = express();
app.use(express.json());

// Define the required scopes for Gmail API
const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.labels",
    "https://mail.google.com/",
];

// Define the label name to be used for categorizing emails
const labelName = "Auto-Reply";

app.get('/', async (req, res) => {

    // Authenticate using credentials from credentials.json and required scopes
    const auth = await authenticate({
        keyfilePath: path.join(__dirname, "credentials.json"),
        scopes: SCOPES,
    });

    const gmail = google.gmail({version: "v1", auth});

    // Fetch the list of labels associated with the Gmail account
    const labelResponse = await gmail.users.labels.list({
        userId: "me", // 'me' refers to the authenticated user
    });

    // Function to retrieve unreplied messages from the inbox
    async function getUnrepliedMessages(auth) {
        const gmail = google.gmail({version: "v1", auth});
        const response = await gmail.users.messages.list({
            userId: "me",
            labelIds: ["INBOX"],
            q: "is:unread", // Filter for unread messages
        });
        return response.data.messages || [];
    }

    // Function to create a label in Gmail if it doesn't exist
    async function createLabel(auth) {
        const gmail = google.gmail({version: "v1", auth});

        try {
            const response = await gmail.users.labels.create({
                userId: "me",
                requestBody: {
                    name: labelName,
                    labelListVisibility: "labelShow",
                    messageListVisibility: "show",
                },
            })

            return response.data.id;
        } catch (error) {
            if (error.code === 409) {
                const response = await gmail.users.labels.list({
                    userId: "me",
                });

                const label = response.data.labels.find(
                    (label) => label.name === labelName
                );

                return label.id;
            } else {
                throw error;
            }
        }
    }

    // Function to handle sending auto-reply messages for unreplied emails
    async function main() {
        const labelID = await createLabel(auth);

        setInterval(async () => {
            const messages = await getUnrepliedMessages(auth);

            if (messages && messages.length > 0) {
                for (const message of messages) {
                    const messageData = await gmail.users.messages.get({
                        auth,
                        userId: "me",
                        id: message.id,
                    });

                    const email = messageData.data;
                    const hasReplied = email.payload.headers.some(
                        (header) => header.name === "IN-REPLY-TO"
                    );

                    if (!hasReplied) {
                        const replyMessage = {
                            userId: "me",
                            resource: {
                                raw: Buffer.from(
                                    `To: ${
                                        email.payload.headers.find(
                                            (header) => header.name === "From"
                                        ).value
                                    }\r\n` +
                                    `Subject: Re: ${
                                        email.payload.headers.find(
                                            (header) => header.name === "Subject"
                                        ).value
                                    }\r\n` +
                                    `Content-Type: text/plain; charset="UTF-8"\r\n` +
                                    `Content-Transfer-Encoding: 7bit\r\n\r\n` +
                                    `Thank you for writing this email. I'm currently on vacation and will get back to you when I return.\r\n`
                                ).toString("base64"),
                            },
                        };

                        // Send the auto-reply message
                        await gmail.users.messages.send(replyMessage);

                        // Move the email to the 'Auto-Reply' label and remove from 'INBOX'
                        await gmail.users.messages.modify({
                            auth,
                            userId: "me",
                            id: message.id,
                            resource: {
                                addLabelIds: [labelID],
                                removeLabelIds: ["INBOX"],
                            },
                        });
                    }
                }
            }
        }, Math.floor(Math.random() * (120 - 45 + 1) + 45) * 1000);
    }

    // Start the main processing
    main();

    // Respond with authentication details
    res.json({"This is Auth": auth});
});

const PORT = 1040;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
