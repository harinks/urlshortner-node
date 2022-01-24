const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoClient = mongodb.MongoClient;
const URL = "mongodb+srv://admin:hari1999@cluster0.piyeq.mongodb.net?retryWrites=true&w=majority"
const secret = "jGa3BhjuS2Msg"
app.use(express.json());
app.use(cors({
    origin: "*",
}))


let authenticate = function (req, res, next) {
    if (req.headers.authorization) {
        try {
            let result = jwt.verify(req.headers.authorization, secret);
            next();
        } catch (error) {
            res.status(401).json({ message: "Token Invalid" })
        }
    } else {
        res.status(401).json({ message: "Not Authorized" })
    }
}



//user registeration
app.post("/register", async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("urlShortner");

        //Password encrypt
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash(req.body.password, salt);
        req.body.password = hash;
        //replace the password with hashing and store in our collection dbb
        await db.collection("users").insertOne(req.body)
        connection.close();
        res.json({ message: "user created!!" })
    } catch (error) {
        console.log(error)
    }
})

//user login

app.post("/login", async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("urlShortner");
        let user = await db.collection("users").findOne({ email: req.body.email }) 
        //if user is undefined then no user is present
        if (user) {
            let passwordResult = await bcrypt.compare(req.body.password, user.password)
            if (passwordResult) {
                let token = jwt.sign({ userid: user._id }, secret, { expiresIn: "1h" });
                res.json({ token })
            } else {
                res.status(401).json({ message: "Email Id or Password did not match" })
            }
        } else {
            res.status(401).json({ message: "Email Id or Password did not match" })
        }
    } catch (error) {
        console.log(error)
    }
})

//get all urls

app.get("/getUrls", async (req, res) => {
    try {
        let connection = await mongoClient.connect(URL)
        let db = connection.db("urlShortner")
        let urls = await db.collection("urlshorts").find({}).toArray()
        await connection.close();
        res.json(urls)
    } catch (error) {
        console.log(error)
    }

})


app.get("/dashboard", authenticate, function (req, res) {
    res.json({ totalusers: 50 })
})

//create urls
app.post("/create-url", async (req, res) => {

    try {
        //connect to db
        let connection = await mongoClient.connect(URL)
        // select db
        let db = connection.db("urlShortner")
        // select collection and do operation
        await db.collection("urlshorts").insertOne({
            url: req.body.url,
            shortUrl: generateUrl()
        })
        await connection.close();
        res.json({ message: "url added" })
    } catch (error) {
        console.log(error)
    }
})

//Generating Url
function generateUrl() {
    var randomUrl = [];
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;

    for (i = 0; i <= 5; i++) {
        randomUrl += characters.charAt(Math.floor(Math.random() * charactersLength))
    };
    return randomUrl
}

app.delete("/url/:id" ,async (req,res) =>{
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("urlShortner");
        let objId = mongodb.ObjectId(req.params.id)
        await db.collection("urlshorts").deleteOne({ _id: objId })
        await connection.close();
        res.json({ message: "User Deleted" })
    } catch (error) {
        
    }
})



app.listen(process.env.PORT || 3000)