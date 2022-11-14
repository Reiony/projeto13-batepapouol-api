import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";
import { MongoClient } from "mongodb";

// Preset

const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

// MongoDB Core

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;

try {
    await mongoClient.connect()
    db = mongoClient.db("batepapoUol");
} catch (err) {
    console.log(err);
}

// MongoDB Collections

const participantsColl = db.collection("participants");
const messagesColl = db.collection("messages");

const userSchema = joi.object({
    name: joi.string().min(1).required()
})

const messagesSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message").required()
})

//Routes

app.post("/participants", async (req, res) => {
    const { name } = req.body;
    const validation = userSchema.validate(name, { abortEarly: false });
    if (validation.error) {
        const error = validation.error.details.map(error => error.message);
        res.status(422).send(error);
        return
    }
    const VerifyUser = participantsColl.findOne({ name: name })
    if (VerifyUser) {
        res.sendStatus(409).send({ message: 'Nome já está sendo utilizado. Escolha um diferente'})
        return
    }

    try {
        await participantsColl.insertOne({ name: name, lastStatus: Date.now() })
        await messagesColl.insertOne({ from: name, to: 'Todos', text: 'entra na sala...', type: 'status', time: dayjs.format('HH:MM:SS') })
        res.sendStatus(201)
    } catch {
        res.sendStatus(500)
    }
})

app.get("/participants", async (req, res) => {
    try {
        const participantsdata = await participantsColl.find.toArray();
        res.status(201).send(participantsdata);
    } catch {
        res.sendStatus(500);
    }
})

app.post("/messages", async (req, res) => {
    const { to, text, type } = req.body;
    const from = req.headers.user;
    const time = dayjs().format("HH:mm:ss")
    const validation = messagesSchema.validate({from, to, text, type }, {abortEarly: false})
    if (validation.error) {
        res.status(422).send(validation.error.details);
        return
    }

    try{
        await messagesColl.insertOne({from, to, text, type, time})
        res.sendStatus(201)
        
    } catch (err) {
        res.sendStatus(500)
    }
})

app.get("/messages", async (req, res) => {
})

app.post("/status", async (req, res) => {

})

app.listen(5000, () => console.log('Server running on port 5000'))