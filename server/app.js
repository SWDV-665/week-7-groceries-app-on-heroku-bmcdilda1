const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');

// Middleware setup
app.use(morgan('dev'));
app.use(express.static('public'));
app.use(express.json());
app.use(cors());

app.use('/uploads', express.static('uploads'));

const port = 8081;
const mongoPort = 27017;
const url = 'mongodb://127.0.0.1:27017/inventoryDB';

let db;
let inventoryCollection;
let usersCollection;

// Connect to MongoDB
MongoClient.connect(url)
    .then(client => {
        console.log(`Connected successfully to MongoDB server on port ${mongoPort}`);
        db = client.db('inventoryDB');
        inventoryCollection = db.collection('homeinv');
        usersCollection = db.collection('users');
        
        // Start the server only after successfully connecting to the database
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    })
    .catch(err => {
        console.error('Error connecting to MongoDB server:', err);
    });

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log('Destination:', 'uploads/');
        cb(null, 'uploads/');  // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        const generatedFileName = Date.now() + path.extname(file.originalname);
        console.log('Generated file name:', generatedFileName);  // Log the filename
        cb(null, generatedFileName);  // Generates a unique filename with original extension
    }
});

const upload = multer({ storage: storage });

// API to create an item in the database with file upload
app.post('/api/Inventory', upload.single('file'), (req, res) => {
    const {
        assetName,
        assetQuantity,
        serialNumber,
        purchaseDate,
        location,
        assetTag,
        picture
    } = req.body;

    const newItem = {
        assetName,
        assetQuantity,
        serialNumber,
        purchaseDate,
        location,
        assetTag,
        picture,
        file: req.file ? req.file.filename : null,
        lastModified: new Date()
    };

    inventoryCollection.insertOne(newItem)
        .then(result => {
            console.log(`Successfully inserted item with _id: ${result.insertedId}`);
            res.status(200).json({ message: `Successfully inserted item with _id: ${result.insertedId}` });
        })
        .catch(err => {
            console.error(`Failed to insert item: ${err}`);
            res.status(500).json({ message: 'Failed to insert item' });
        });
});

// Login route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt for username:', username);

    try {
        if (!usersCollection) {
            console.error('Users collection not initialized');
            throw new Error('Users collection not initialized');
        }

        console.log('Searching for user in database...');
        const user = await usersCollection.findOne({ username, password });

        if (!user) {
            console.log('User not found or password incorrect');
            return res.status(401).json({ message: 'Authentication failed' });
        }

        console.log('User found, generating token...');
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            'your_jwt_secret',  // Replace with a secure secret key
            { expiresIn: '1h' }
        );

        console.log('Login successful for user:', username);
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// API to get all inventory items or the latest item based on a query parameter
app.get('/api/Inventory', (req, res) => {
    const limit = parseInt(req.query.limit) || 0;

    inventoryCollection.find({}).sort({ lastModified: -1 }).limit(limit).toArray()
        .then(docs => {
            res.json(docs);
            if (limit === 1) {
                console.log("Returning the latest item");
            } else {
                console.log("Returning all items");
            }
        })
        .catch(err => {
            console.error('Error getting documents from collection:', err);
            res.status(500).json({ message: 'Error getting documents from collection' });
        });
});

// API to update an item in the database
app.put('/api/Inventory', (req, res) => {
    const { _id, updates } = req.body;
    const ObjectId = require('mongodb').ObjectId;
    const itemid = new ObjectId(_id);

    inventoryCollection.updateOne({ _id: itemid }, { $set: updates })
        .then(result => {
            if (result.matchedCount > 0) {
                console.log(`Successfully updated item with id: ${_id}`);
                res.status(200).json({ message: `Successfully updated item with id: ${_id}` });
            } else {
                console.log(`No items matched with id: ${_id}`);
                res.status(404).json({ message: `No items matched with id: ${_id}` });
            }
        })
        .catch(err => {
            console.error(`Failed to update item: ${err}`);
            res.status(500).json({ message: 'Failed to update item' });
        });
});

// API to delete an item from the database by id
app.delete('/api/Inventory/:id', (req, res) => {
    const assetId = req.params.id;
    const ObjectId = require('mongodb').ObjectId;
    const itemid = new ObjectId(assetId);

    inventoryCollection.deleteOne({ _id: itemid })
        .then(result => {
            if (result.deletedCount > 0) {
                console.log(`Successfully deleted item with id: ${assetId}`);
                res.status(200).json({ message: `Successfully deleted item with id: ${assetId}` });
            } else {
                console.log(`No items matched with id: ${assetId}`);
                res.status(404).json({ message: `No items matched with id: ${assetId}` });
            }
        })
        .catch(err => {
            console.error(`Failed to delete item: ${err}`);
            res.status(500).json({ message: 'Failed to delete item' });
        });
});

// API to get server connection info
app.get('/api/connection-info', (req, res) => {
    if (db) {
        res.json({
            status: 'Connected',
            details: `Connected to MongoDB on port ${mongoPort}, Database: inventoryDB`
        });
    } else {
        res.json({
            status: 'Disconnected',
            details: 'Not connected to MongoDB'
        });
    }
});

//  Retrieving a specific file by name
app.get('/api/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'uploads', filename);
    res.sendFile(filepath, err => {
        if (err) {
            console.error('File not found:', filepath);
            res.status(404).send('File not found');
        }
    });
});