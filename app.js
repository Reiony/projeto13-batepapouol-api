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

try{
    await mongoClient.connect()
    db = mongoClient.db("batepapoUol");
} catch (err){
    console.log(err);
}

// MongoDB Collections

const participantsColl = db.collection("participants");
const messagesColl = db.collection("messages");

const userSchema = joi.object({
    name: joi.string().min(1).required()
})


app.listen(5000, () => console.log('Server running on port 5000'))