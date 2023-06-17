const express= require('express');
const app =express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors=require('cors');
require('dotenv').config()
const port =process.env.PORT ||5000;


app.use(cors());
app.use(express.json());




const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  jwt.verify(token, process.env.SECRET_JWT_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kct9xpl.mongodb.net/?retryWrites=true&w=majority`;

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
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    const usersCollection = client.db("YogaSchool").collection("users");
    const classesCollection = client.db("YogaSchool").collection("classes");
    const instructorsCollection = client.db("YogaSchool").collection("instructors");


    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_JWT_TOKEN, { expiresIn: '1h' })
      res.send({ token })
    })

    //  cart api
    //  app.post('/carts', async (req, res) => {
    //   const Class = req.body;
    //   const result = await cartsCollection.insertOne(Class);
    //   res.send(result);
    // })

    
    //  class  api
    app.get("/classes", async (req, res) => {
      const classes = await classesCollection.find({}).sort({availableSeats :-1}).toArray();
        
        
      res.send(classes);
    });
    app.get("/instructors", async (req, res) => {
      const classes = await instructorsCollection.find({}).toArray();
        
        
      res.send(classes);
    });

    app.get("/class", async (req, res) => {
      const Class = await classesCollection.find({}).limit(6).sort({availableSeats :-1}).toArray();
       
        
      res.send(Class);
    });
    app.get("/instructor", async (req, res) => {
      const Class = await instructorsCollection.find({}).limit(6).toArray();
       
        
      res.send(Class);
    });
    // Add class
            
   app.post("/addClass", async (req, res) => {
    const body = req.body;
    const result = await classesCollection.insertOne(body);
 
    res.send(result);
     });

     app.get("/myClass/:email", async (req, res) => {
      const cls = await classesCollection
        .find({
          email: req.params.email,}).sort({price :1}).toArray();
      res.send(cls);
    });



    // set role
    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
        return  res.send({ instructor: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === 'instructor' }
        res.send(result);
    })
    app.get('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;

      if (req.decoded.email !== email) {
       return res.send({ admin: false })
      }

      const query = { email: email }
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === 'admin' }
      res.send(result);
    })

    app.patch('/users/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'instructor'
        },
      };

      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // delete user

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/users',async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'already exists' })
      }

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
  }
}
run().catch(console.dir);




app.get ('/',(req,res)=>{
    res.send('Yoga school server is running ')
})

app.listen(port,()=>{
    console.log(`Yoga school server  running on port ${port}`)
})