const express = require('express');
const app = express();


// Middlewares
app.use(express.json());


// Basic route
app.get('/hello-world', (req, res) => {
    res.json({"message" : 'Hello World 🚀'});
});


// Start server
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});