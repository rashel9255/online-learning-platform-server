const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

dotenv.config();

// middleware
app.use(cors());
app.use(express.json())

//mongodb connection uri 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ocgkty.mongodb.net/?appName=Cluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });


//default route
app.get("/", (req, res) => {
    res.send("🚀 Online Learning Platform Server is Running...");
});
       

async function run() {
    try{
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db(process.env.DB_NAME);
        const courseCollection = db.collection("courses");

        //get all courses api
        app.get("/courses", async (req, res) => {
            const cursor = courseCollection.find();
            const courses = await cursor.toArray();
            res.send(courses);
        });

        // get a single course api
        app.get("/courses/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const course = await courseCollection.findOne(query);
            res.send(course);
        });

        //add new course api
        app.post("/courses", async (req, res) => {
            const newCourse = req.body;
            const result = await courseCollection.insertOne(newCourse);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB connected successfully!");
    }
    finally{

    }
} 

run().catch(console.dir);

app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
