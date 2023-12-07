const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
const axios = require('axios');
app.use(cors());
require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the directory of this script
app.use(express.static(__dirname)); 


/////////////////////////////


// OpenAI Config
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


//process.env.OPENAI_API_KEY
//express.urlencoded({ extended: true })



//AI
app.post('/generate-data', async (req, res) => {
    const { description } = req.body;
    
    try {
        const numberInput = req.body.number;
        const descriptionInput = req.body.description;
        // Use the OpenAI API to generate text based on the description
        const response = await openai.chat.completions.create({
            "max_tokens": 150,
            model: "gpt-3.5-turbo",
            messages: [
                {
                    "role": "system",
                    "content": "Return " + numberInput + " examples of the description provided by user. Variants should be as concise as possible. For example if the request is cities, just list the city name. Return responses as a comma-separated JSON response"
                },
                {
                    "role": "user",
                    "content": descriptionInput
                }
            ],
        });

        // Send back the first generated item
        console.log(response.choices[0].message.content);
        res.send(response)
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating data');
    }
});



//////////////////////////////////////////////

app.post('/generate-csv', (req, res) => {
    const csvData = req.body; // Receive the final CSV data as a text

    res.setHeader('Content-disposition', 'attachment; filename=generated-data.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvData);
});

// Generate CSV
/*
app.post('/generate-csv', (req, res) => {
    console.log('Received request at /generate-data:', req.body);
    const { columnNames, sampleData, rowCount, sliderValues } = req.body;
    let csvContent = columnNames.join(",") + "\n";

    for (let i = 0; i < rowCount; i++) {
        let row = columnNames.map((_, index) => {
            const dataSamples = sampleData[index];
            const randomSample = dataSamples[Math.floor(Math.random() * dataSamples.length)];
            return randomizeString(randomSample, sliderValues[index]);
        });
        csvContent += row.join(",") + "\n";
    }

    res.setHeader('Content-disposition', 'attachment; filename=generated-data.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvContent);
});
*/

//RANDOMIZE STRING
/*
function randomizeString(str, fixedLength) {
    fixedLength = parseInt(fixedLength, 10); // Ensure it's a number
    const fixedPart = str.substring(0, fixedLength);
    const randomPart = str.substring(fixedLength)
        .replace(/\d/g, () => Math.floor(Math.random() * 10))
        .replace(/[a-z]/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
        .replace(/[A-Z]/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    return fixedPart + randomPart;
}
*/

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
