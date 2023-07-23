
const express = require('express')
const app = express()
const port = 5000
const cors = require('cors');
require('dotenv').config();

app.use(cors())

app.get('/', (req, res) => {
    res.send('Hello World!')
})

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { status } = require("express/lib/response");
const uri = `mongodb+srv://${process.env.CH_USER}:${process.env.CH_PASS}@cluster0.bna95n2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        const CollegeHub = client.db("CollegeHub");
        const AllColleges = CollegeHub.collection("AllColleges");
        const Reviews = CollegeHub.collection("Reviews");


        // app.get("/colleges", async (req, res) => {
        //     const query = {};
        //     const cursor = AllColleges.find(query);
        //     const colleges = await cursor.toArray();
        //     res.send(colleges);
        // })

        app.get("/colleges", async (req, res) => {
            const sb = req.query?.name;
            const limit = parseInt(req.query?.limit) || 0;
            let query = {};
            // console.log(sb, limit)

            if (sb) {
                // query = {name : sb};
                query = { college_name: { $regex: sb, $options: "i" } };
            }

            const cursor = AllColleges.find(query).limit(limit);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get("/colleges/:id", async (req, res) => {
            const id = req.params;
            const college = await AllColleges.findOne({_id: new ObjectId(id)});
            res.send(college);
        })


        // Reviews 
        app.get("/reviews", async (req, res) => {
            const cursor = Reviews.find();
            const result = await cursor.toArray();
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})