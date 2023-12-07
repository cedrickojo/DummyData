function addColumn() {
    const columnsDiv = document.getElementById("columns");
    const newColumnDiv = document.createElement("div");

    newColumnDiv.className = 'column';
    newColumnDiv.innerHTML = `
        <input type="checkbox" class="column-checkbox" onchange="toggleCheckbox(this)">
        <input type="text" name="columnName[]" placeholder="Column Name">
        <input type="text" name="sampleData[]" placeholder="Sample Data (comma-separated)" oninput="updateSlider(this)">
        <input type="range" name="slider[]" min="0" max="0" value="0" oninput="updateNumber(this)">
        <i class="fas fa-sync-alt refresh-icon" style="display: none;"></i>
        <output class="slider-output">0</output>
        <p class="ai-Preview"" style="display:none"></p>
    `;

    columnsDiv.appendChild(newColumnDiv);
    
    // Find the newly added checkbox and attach the event listener
    const newCheckbox = newColumnDiv.querySelector('.column-checkbox');
    newCheckbox.addEventListener('change', function() {
        toggleCheckbox(this);
    });
    newCheckbox.dispatchEvent(new Event('change'));

     // Find the newly added sample data input and attach the updateSlider event
     const newSampleDataInput = newColumnDiv.querySelector('input[name="sampleData[]"]');
     newSampleDataInput.addEventListener('input', function() {
         updateSlider(this);
     });

    const newRefreshIcon = newColumnDiv.querySelector('.refresh-icon');
    newRefreshIcon.addEventListener('click', function() {
    handleRefreshClick(this);
});
}

function toggleCheckbox(checkbox) {
    const column = checkbox.parentNode;
    const slider = column.querySelector('input[type="range"]');
    const output = column.querySelector('output');
    const sampleDataInput = column.querySelector('input[type="text"][name="sampleData[]"]');
    const refreshIcon = column.querySelector('.refresh-icon');
    const aiPreview = column.querySelector('.ai-Preview');

    
    if (checkbox.checked) {
        // Hide the slider and its output
        slider.style.display = 'none';
        output.style.display = 'none';
        refreshIcon.style.display = 'inline-block';
        aiPreview.style.display = '';
        
        // Change styles for the sample data input field
        sampleDataInput.style.color = '#9c27b0'; // Purple text color
        sampleDataInput.style.borderColor = '#9c27b0'; // Purple border color
        sampleDataInput.style.boxShadow = '0 0 5px #9c27b0'; // Uniform purple box shadow

        const description = checkbox.nextElementSibling.value;


    } else {
        // Show the slider and its output
        slider.style.display = '';
        output.style.display = '';
        refreshIcon.style.display = 'none';
        aiPreview.style.display = 'none';
        
        // Revert styles for the sample data input field
        sampleDataInput.style.color = ''; // Revert text color
        sampleDataInput.style.borderColor = ''; // Revert border color
        sampleDataInput.style.boxShadow = ''; // Remove box shadow
    }
}


function removeColumn() {
    const columnsDiv = document.getElementById("columns");
    if (columnsDiv.children.length > 1) {
        columnsDiv.removeChild(columnsDiv.lastChild);
    }
}

function updateSlider(input) {
    const slider = input.nextElementSibling;
    const output = slider.nextElementSibling.nextElementSibling;
    slider.max = input.value.length;
    slider.value = Math.min(slider.value, input.value.length);
    output.value = slider.value;
}

function updateNumber(slider) {
    const output = slider.nextElementSibling;
    output.value = slider.value;
}

async function handleRefreshClick(icon) {
    const column = icon.closest('.column');
    const aiPreview = column.querySelector('.ai-Preview');

    const generatedContent = await pingOpenAI(column,2);
    aiPreview.textContent = generatedContent;
    aiPreview.style.display = generatedContent ? 'block' : 'none';
}

function updateRefreshIconState(inputField) {
    const column = inputField.closest('.column');
    const refreshIcon = column.querySelector('.refresh-icon');
    if (inputField.value.trim() === "") {
        refreshIcon.classList.add('disabled'); // Add a 'disabled' class for styling
    } else {
        refreshIcon.classList.remove('disabled');
    }
}

async function pingOpenAI(column, numRows) {
    try {
        const sampleDataInput = column.querySelector('input[name="sampleData[]"]');
        const description = sampleDataInput.value;
        const aiPreview = column.querySelector('.ai-Preview');

        const requestBody = {
            description: description,
            number: numRows
        };

        const response = await fetch('/generate-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        //string response
        //return data.choices[0].message.content;
        
        //comma-split response
        return data.choices[0].message.content.split(',').slice(0, numRows);

        console.log(data);
    } catch (error) {
        console.error('Error:', error);
        return '';
    }
}

function randomizeString(str, fixedLength) {
    fixedLength = parseInt(fixedLength, 10); // Ensure it's a number
    const fixedPart = str.substring(0, fixedLength);
    const randomPart = str.substring(fixedLength)
        .replace(/\d/g, () => Math.floor(Math.random() * 10))
        .replace(/[a-z]/g, () => String.fromCharCode(97 + Math.floor(Math.random() * 26)))
        .replace(/[A-Z]/g, () => String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    return fixedPart + randomPart;
}

document.getElementById("dataForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const columns = document.querySelectorAll('.column');
    const rowCount = parseInt(document.getElementById('numRows').value);
    let csvData = [];

    for (let column of columns) {
        const checkBox = column.querySelector('.column-checkbox');
        const sampleDataInput = column.querySelector('input[name="sampleData[]"]');
        let columnData = [];

        if (checkBox.checked) {
            // If the checkbox is checked, call pingOpenAI and await its result
            columnData = await pingOpenAI(column, rowCount);
        } else {
            // If checkbox is not checked, use the existing scramble methodology
            for (let i = 0; i < rowCount; i++) {
                columnData.push(randomizeString(sampleDataInput.value));
            }
        }

        csvData.push(columnData);
    }

    // Prepare the data to send to the server for CSV file generation
    const finalData = csvData[0].map((_, colIndex) => csvData.map(row => row[colIndex]).join(',')).join('\n');

    // Send the final data to the server
    fetch('/generate-csv', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain', // Change content type to text/plain
        },
        body: finalData
    })
    .then(response => response.blob())
    .then(blob => {
        // Create and download CSV file
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'generated-data.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch(error => console.error('Error:', error));
});



/* OLD CSV GENERATION
// OLD CSV GENERATION
document.getElementById("dataForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const sliderValues = Array.from(document.querySelectorAll('input[type="range"]')).map(slider => slider.value);
    const data = {
        columnNames: formData.getAll("columnName[]"),
        sampleData: formData.getAll("sampleData[]").map(data => data.split(",")),
        sliderValues,
        rowCount: formData.get("rowCount")
    };

    fetch('/generate-csv', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "generated-data.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => console.error('Error:', error));
});

*/

document.addEventListener('DOMContentLoaded', function() {
    const firstCheckbox = document.querySelector('.column-checkbox');
    if (firstCheckbox) {
        firstCheckbox.addEventListener('change', function() {
            toggleCheckbox(this);
        });
    }
});



document.getElementById("removeColumnBtn").addEventListener("click", removeColumn);