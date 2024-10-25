const forms = {}; // Store all forms in memory

// Function to add a new row to the table for defining form fields
function addRow() {
    const tableBody = document.getElementById("tableBody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="text" placeholder="Field Name" required></td>
        <td>
            <select>
                <option value="String">String</option>
                <option value="Number">Number</option>
                <option value="Dropdown">Dropdown</option>
                <option value="True/false">True/false</option>
                <option value="Date">Date</option>
            </select>
        </td>
        <td>
            <select>
                <option value="true">True</option>
                <option value="false">False</option>
            </select>
        </td>
        <td><input type="text" placeholder="Options (comma-separated, for Dropdown only)"></td>
        <td><button onclick="deleteRow(this)">Delete</button></td>
    `;
    tableBody.appendChild(row);
}

// Function to delete a row
function deleteRow(button) {
    const row = button.parentElement.parentElement;
    row.remove();
}

// Function to save the form configuration as a downloadable JSON file
function saveJson() {
    const title = document.getElementById("formTitle").value.trim();
    const rows = document.querySelectorAll("#tableBody tr");
    const formFields = [];

    if (!title) {
        alert("Please enter a form title.");
        return;
    }

    if (rows.length === 0) {
        alert("Please add at least one field to save the form.");
        return;
    }

    rows.forEach(row => {
        const fieldName = row.cells[0].querySelector("input").value.trim();
        const fieldType = row.cells[1].querySelector("select").value;
        const mandatory = row.cells[2].querySelector("select").value === "true";
        const options = row.cells[3].querySelector("input").value.split(",").map(option => option.trim()).filter(Boolean);

        if (!fieldName) {
            alert("Please fill out all required fields.");
            return;
        }

        formFields.push({ fieldName, fieldType, mandatory, options });
    });

    const formData = { title, fields: formFields, submissions: [] };

    // Store the form data in the forms object
    forms[title] = formData;

    // Update the dropdown with the form title
    updateFormSelect();

    // Convert the formData object to JSON format and create a Blob
    const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a download link element
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.json`;
    a.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);

    alert("Form configuration downloaded as JSON file!");
}

// Function to update the form select dropdown
function updateFormSelect() {
    const formSelect = document.getElementById("formSelect");
    formSelect.innerHTML = `<option value="">-- Select Form --</option>`; // Reset options

    Object.keys(forms).forEach(title => {
        const option = document.createElement("option");
        option.value = title;
        option.textContent = title;
        formSelect.appendChild(option);
    });
}

// Function to load the form configuration from a selected JSON file
function loadJson() {
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a JSON file to load.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        try {
            const { title, fields, submissions } = JSON.parse(content);
            document.getElementById("formTitle").value = title;

            const tableBody = document.getElementById("tableBody");
            tableBody.innerHTML = "";

            fields.forEach(field => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><input type="text" value="${field.fieldName}" required></td>
                    <td>
                        <select>
                            <option value="String" ${field.fieldType === "String" ? "selected" : ""}>String</option>
                            <option value="Number" ${field.fieldType === "Number" ? "selected" : ""}>Number</option>
                            <option value="Dropdown" ${field.fieldType === "Dropdown" ? "selected" : ""}>Dropdown</option>
                            <option value="True/false" ${field.fieldType === "True/false" ? "selected" : ""}>True/false</option>
                            <option value="Date" ${field.fieldType === "Date" ? "selected" : ""}>Date</option>
                        </select>
                    </td>
                    <td>
                        <select>
                            <option value="true" ${field.mandatory ? "selected" : ""}>True</option>
                            <option value="false" ${!field.mandatory ? "selected" : ""}>False</option>
                        </select>
                    </td>
                    <td><input type="text" value="${field.options.join(", ")}" placeholder="Options (comma-separated)"></td>
                    <td><button onclick="deleteRow(this)">Delete</button></td>
                `;
                tableBody.appendChild(row);
            });

            // Automatically generate the form after loading JSON
            generateForm();

            // Store the loaded form data in the forms object
            forms[title] = { title, fields, submissions };
            updateFormSelect();
        } catch (error) {
            alert("Invalid JSON format. Please ensure the file is correctly formatted.");
        }
    };

    reader.readAsText(file);
}

// Function to load the selected existing form from the dropdown
function loadSelectedForm() {
    const formSelect = document.getElementById("formSelect");
    const title = formSelect.value;

    if (title && forms[title]) {
        const { fields, submissions } = forms[title];
        document.getElementById("formTitle").value = title;

        const tableBody = document.getElementById("tableBody");
        tableBody.innerHTML = "";

        fields.forEach(field => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><input type="text" value="${field.fieldName}" required></td>
                <td>
                    <select>
                        <option value="String" ${field.fieldType === "String" ? "selected" : ""}>String</option>
                        <option value="Number" ${field.fieldType === "Number" ? "selected" : ""}>Number</option>
                        <option value="Dropdown" ${field.fieldType === "Dropdown" ? "selected" : ""}>Dropdown</option>
                        <option value="True/false" ${field.fieldType === "True/false" ? "selected" : ""}>True/false</option>
                        <option value="Date" ${field.fieldType === "Date" ? "selected" : ""}>Date</option>
                    </select>
                </td>
                <td>
                    <select>
                        <option value="true" ${field.mandatory ? "selected" : ""}>True</option>
                        <option value="false" ${!field.mandatory ? "selected" : ""}>False</option>
                    </select>
                </td>
                <td><input type="text" value="${field.options.join(", ")}" placeholder="Options (comma-separated)"></td>
                <td><button onclick="deleteRow(this)">Delete</button></td>
            `;
            tableBody.appendChild(row);
        });

        // Display the last 10 submissions
        displaySubmissions(submissions);

        // Automatically generate the form
        generateForm();
    }
}

// Function to generate the dynamic form
function generateForm() {
    const title = document.getElementById("formTitle").value.trim();
    const fields = Object.values(forms[title]?.fields || []);
    const generatedForm = document.getElementById("generatedForm");
    generatedForm.innerHTML = `<h3>${title}</h3>`;

    fields.forEach(({ fieldName, fieldType, mandatory, options }) => {
        const fieldWrapper = document.createElement("div");
        fieldWrapper.innerHTML = `<label>${fieldName}</label>`;
        let input;

        if (fieldType === "String" || fieldType === "Number" || fieldType === "Date") {
            input = document.createElement("input");
            input.type = fieldType === "Number" ? "number" : fieldType === "Date" ? "date" : "text";
            if (mandatory) input.required = true;
        } else if (fieldType === "Dropdown") {
            input = document.createElement("select");
            options.forEach(option => {
                const opt = document.createElement("option");
                opt.value = option;
                opt.textContent = option;
                input.appendChild(opt);
            });
            if (mandatory) input.required = true;
        } else if (fieldType === "True/false") {
            input = document.createElement("select");
            const trueOption = document.createElement("option");
            trueOption.value = "true";
            trueOption.textContent = "True";
            const falseOption = document.createElement("option");
            falseOption.value = "false";
            falseOption.textContent = "False";
            input.appendChild(trueOption);
            input.appendChild(falseOption);
        }

        fieldWrapper.appendChild(input);
        generatedForm.appendChild(fieldWrapper);
    });
}

// Function to submit the form
function submitForm() {
    const title = document.getElementById("formTitle").value.trim();
    const fields = Object.values(forms[title]?.fields || []);
    const submissions = forms[title]?.submissions || [];
    const submissionData = {};

    fields.forEach(({ fieldName, fieldType }) => {
        const input = generatedForm.querySelector(`input[placeholder="${fieldName}"]`) || generatedForm.querySelector(`select[label="${fieldName}"]`);
        submissionData[fieldName] = input ? input.value : "";
    });

    submissions.push(submissionData);
    forms[title].submissions = submissions;

    alert("Form submitted successfully!");
    displaySubmissions(submissions);
}

// Function to display the last 10 submissions
function displaySubmissions(submissions) {
    const submissionList = document.getElementById("submissionList");
    submissionList.innerHTML = "";

    submissions.slice(-10).forEach((submission, index) => {
        const li = document.createElement("li");
        li.textContent = `Submission ${submissions.length - 10 + index + 1}: ${JSON.stringify(submission)}`;
        submissionList.appendChild(li);
    });
}

// Attach the load JSON function to the button click
document.getElementById("loadJsonButton").addEventListener("click", loadJson);
