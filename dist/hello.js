"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const twilio_1 = __importDefault(require("twilio"));
// Your Twilio credentials
const accountSid = 'ACdde7b682cc5da97f66cb162782b3f453';
const authToken = 'c467efd7ec600dc798435d3324cf9a69';
const twilioPhoneNumber = "+18666916450";
// Create a Twilio client
const client = (0, twilio_1.default)(accountSid, authToken);
async function sendMessage() {
    try {
        const message = await client.messages.create({
            body: 'hi',
            from: twilioPhoneNumber,
            to: '+18606825640' // Adding +1 for US number format
        });
        console.log('Message sent successfully! SID:', message.sid);
    }
    catch (error) {
        console.error('Error sending message:', error);
    }
}
// Execute the function
sendMessage();
