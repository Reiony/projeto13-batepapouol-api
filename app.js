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
    await mongoClient.connect();
    db = mongoClient.db("batepapoUol");
} catch (err) {
    console.log(err);
}

// MongoDB Collections

const participantsColl = db.collection("participants");
const messagesColl = db.collection("messages");

//Joi validations 

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
    const user = req.body;
    try {
        const userTime = Date.now();
        const timeFormatted = dayjs(userTime).format("HH:mm:ss")
        const validation = userSchema.validate(user, { abortEarly: false });
        if (validation.error) {
            const error = validation.error.details.map(error => error.message);
            res.status(422).send(error);
            return
        }

        const VerifyUser = await participantsColl.findOne({ name: user.name })

        if (VerifyUser) {
            res.sendStatus(409).send({ message: 'Nome já está sendo utilizado. Escolha um diferente' });
            return
        }

        await participantsColl.insertOne({ ...user, lastStatus: Date.now() });
        await messagesColl.insertOne({ from: user.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: timeFormatted });
        res.sendStatus(201);
    } catch (err) {
        res.status(500).send(err);
    }
})

app.get("/participants", async (req, res) => {
    try {
        const participantsdata = await participantsColl.find({}).toArray();
        res.status(201).send(participantsdata);
    } catch {
        res.sendStatus(500);
    }
})

app.post("/messages", async (req, res) => {
    const message = req.body;
    const { user } = req.headers;
    const time = dayjs().format("HH:mm:ss");
    const validation = messagesSchema.validate(message, { abortEarly: false });
    if (validation.error) {
        res.status(422).send(validation.error.details);
        return
    }

    try {
        await messagesColl.insertOne({...message, from: user, time: time});
        res.sendStatus(201);

    } catch (err) {
        res.status(500).send(err);
    }
})

app.get("/messages", async (req, res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;
    if (limit) {
        try {
            const findmessage = await messagesColl.find({ $or: [{ to: user, type: "private_message" }, { type: "message" }] }).toArray();
            res.status(200).send(findmessage.slice(0, limit));
        } catch (err) {
            res.status(500).send(err)
        }
    }
})

app.post("/status", async (req, res) => {
    const user = req.get("User");
    try {
        const participant = await participantsColl.findOne({ name: user });
        if (participant === null) {
            res.sendStatus(404);
        } else {
            await participantsColl.updateOne({ _id: stats._id }, { $set: { lastStatus: Date.now() } });
            res.sendStatus(200);
        }
    } catch (err) {
        res.status(500).send(err);
    }
})

/* setInterval(async () => {
    try {
        const date = Date.now();
        const usersonline = await participantsColl.find().toArray();
        usersonline.forEach(async (e) => {
            if (date - e.lastStatus > 10000) {
                await messagesColl.insertOne({ from: e.name, to: "Todos", text: "sai da sala...", type: "status", time: dayjs().format("HH:MM:SS") })
            }
            await usersonline.deleteOne({ name: e.name });
        });
    } catch (err) {
        console.log(err);
    }
}, 15000); */


app.listen(5000, () => console.log('Server running on port 5000'))