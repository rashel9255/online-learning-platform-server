const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

dotenv.config();

// middleware
app.use(cors());
app.use(express.json());

//mongodb connection uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ocgkty.mongodb.net/?appName=Cluster`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

//default route
app.get("/", (req, res) => {
    res.send("🚀 Online Learning Platform Server is Running...");
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db(process.env.DB_NAME);
        const courseCollection = db.collection("courses");
        const usersCollection = db.collection("users");

        //get all courses api
        app.get("/courses", async (req, res) => {
            console.log(req.query);
            const cursor = courseCollection.find();
            const courses = await cursor.toArray();
            res.send(courses);
        });

        //popular courses api
        app.get("/courses/popular-courses", async (req, res) => {
            const cursor = courseCollection.find().sort({ studentsEnrolled: -1 }).limit(6);
            const popularCourses = await cursor.toArray();
            res.send(popularCourses);
        });

        // get a single course api
        app.get("/courses/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const course = await courseCollection.findOne(query);
            res.send(course);
        });

        // Get courses added by a specific user (instructor)
        app.get("/courses/user/:email", async (req, res) => {
            const email = req.params.email;
            const query = { "instructor.email": email };
            const userCourses = await courseCollection.find(query).toArray();
            res.send(userCourses);
        });

        //add new course api
        app.post("/courses", async (req, res) => {
            const newCourse = req.body;
            const result = await courseCollection.insertOne(newCourse);
            res.send(result);
        });

        //update a course api
        app.patch("/courses/:id", async (req, res) => {
            const id = req.params.id;
            const updatedCourse = req.body;
            const query = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    title: updatedCourse.title,
                    course_name: updatedCourse.title, // Keep for backward compatibility
                    price: parseFloat(updatedCourse.price),
                    category: updatedCourse.category,
                    description: updatedCourse.description,
                    duration: updatedCourse.duration,
                    thumbnail: updatedCourse.thumbnail || updatedCourse.image,
                    image: updatedCourse.thumbnail || updatedCourse.image,
                    isFeatured: updatedCourse.isFeatured,
                    lastUpdated: new Date().toISOString().split("T")[0],
                },
            };
            const result = await courseCollection.updateOne(query, updatedDoc);
            res.send(result);
        });

        // Delete a course api
        app.delete("/courses/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await courseCollection.deleteOne(query);
            res.send(result);
        });

        //top instructor api
        app.get("/instructors/top", async (req, res) => {
            const topInstructors = await courseCollection
                .aggregate([
                    {
                        $group: {
                            _id: "$instructor.name",
                            name: { $first: "$instructor.name" },
                            bio: { $first: "$instructor.bio" },
                            avatar: { $first: "$instructor.avatar" },
                            rating: { $avg: "$instructor.rating" },
                            totalCourses: { $sum: 1 },
                        },
                    },
                    { $sort: { rating: -1, totalCourses: -1 } },
                    { $limit: 4 },
                ])
                .toArray();

            res.send(topInstructors);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("MongoDB connected successfully!");
    } finally {
    }
}

run().catch(console.dir);

app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
});
