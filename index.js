
const express = require('express')
const app = express()
const port = 5000
const cors = require('cors');
require('dotenv').config();

// middle wares 
const corsConfig = {
    origin: "*",
    credential: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
}
app.use(cors(corsConfig));
// app.use(cors());
app.use(express.json());



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
        const CHAdmissionList = CollegeHub.collection("CHAdmissionList");


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
            const college = await AllColleges.findOne({ _id: new ObjectId(id) });
            res.send(college);
        })


        // Reviews 
        app.get("/reviews", async (req, res) => {
            const cursor = Reviews.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.post("/review", async (req, res) => {
            const newReview = req.body;
            // console.log(newReview)
            const result = await Reviews.insertOne(newReview);
            res.send(result)
        })

        // Admission 
        app.post("/admission", async (req, res) => {
            const candidateInfo = req.body;
            // console.log(candidateInfo)

            const college = await AllColleges.findOne({ _id: new ObjectId(candidateInfo?.collegeId) });
            // console.log(college.college_name)

            const newCandidateInfo = { ...candidateInfo, college_name: college.college_name }
            const result = await CHAdmissionList.insertOne(newCandidateInfo);

            // const result = await CHAdmissionList.insertOne(candidateInfo);
            res.send(result)
        })

        // college info for an user for admission 
        app.get("/my-college", async (req, res) => {
            const email = req.query?.email;
            const cursor = await CHAdmissionList.findOne({ email: email });

            if (cursor?.collegeId) {
                const collegeID = cursor.collegeId;
                const college = await AllColleges.findOne({ _id: new ObjectId(collegeID) });
                // console.log(college)
                res.send(college);
                return;
            }

            // res.status(404).send({message: "You have not get admit yet!"});
            res.send({});

        })

        app.get("/myProfile", async (req, res) => {
            const email = req.query?.email;
            const data = await CHAdmissionList.findOne({ email: email });
            res.send(data);
        })

        app.patch("/myProfile/:id", async (req, res) => {
            const id = req.params?.id;
            const newData = req.body;
            // const data = await CHAdmissionList.findOne({ email: email }); 
            // res.send(data);

            const filter = { _id: new ObjectId(id) };
            // this option instructs the method to create a document if no documents match the filter
            const options = { upsert: true };
            // create a document that sets the plot of the movie
            const updateDoc = {
                $set: {
                    firstName: newData.firstName, LastName: newData.LastName, PhoneNumber: newData.PhoneNumber, email: newData.email, address: newData.address, collegeId: newData.collegeId, college_name: newData.college_name
                },
            };
            const result = await CHAdmissionList.updateOne(filter, updateDoc, options);
            res.send(result);

            console.log(result)
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