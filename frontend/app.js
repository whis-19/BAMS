// Wait for the HTML document to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Configuration ---
    const API_BASE_URL = "http://localhost:3001";
    const resultBox = document.getElementById("api-result");

    // --- Helper Function for API calls ---
    /**
     * @param {string} endpoint - The API endpoint (e.g., "/departments")
     * @param {string} method - "GET", "POST", "PUT", "DELETE"
     * @param {object} [body=null] - The JSON body for POST/PUT requests
     */
    async function fetchApi(endpoint, method, body = null) {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                // If API returns an error, show it
                throw new Error(data.error || "Unknown API Error");
            }
            
            // Show successful response in the result box
            showResult(data);
            
        } catch (error) {
            // Show network or API errors
            showResult({ error: error.message });
        }
    }

    // --- Helper Function to display results ---
    function showResult(data) {
        // Pretty-print the JSON object
        resultBox.textContent = JSON.stringify(data, null, 4);
    }

    // --- Event Listeners for Forms ---

    // 1. Create Department
    document.getElementById("form-create-dept").addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent page reload
        const name = document.getElementById("dept-name").value;
        fetchApi("/departments", "POST", { name });
    });

    // 2. Create Class
    document.getElementById("form-create-class").addEventListener("submit", (e) => {
        e.preventDefault();
        const deptName = document.getElementById("class-dept-name").value;
        const name = document.getElementById("class-name").value;
        fetchApi(`/departments/${deptName}/classes`, "POST", { name });
    });

    // 3. Create Student
    document.getElementById("form-create-student").addEventListener("submit", (e) => {
        e.preventDefault();
        const deptName = document.getElementById("student-dept-name").value;
        const className = document.getElementById("student-class-name").value;
        const name = document.getElementById("student-name").value;
        const rollNo = document.getElementById("student-rollno").value;
        
        fetchApi(`/departments/${deptName}/classes/${className}/students`, "POST", { name, rollNo });
    });

    // 4. Mark Attendance
    document.getElementById("form-mark-attendance").addEventListener("submit", (e) => {
        e.preventDefault();
        const deptName = document.getElementById("attn-dept").value;
        const className = document.getElementById("attn-class").value;
        const rollNo = document.getElementById("attn-rollno").value;
        const status = document.getElementById("attn-status").value;

        fetchApi("/attendance", "POST", { deptName, className, rollNo, status });
    });

    // 5. View Student Chain
    document.getElementById("form-view-student").addEventListener("submit", (e) => {
        e.preventDefault();
        const deptName = document.getElementById("view-dept").value;
        const className = document.getElementById("view-class").value;
        const rollNo = document.getElementById("view-rollno").value;
        
        // This is a GET request, so no body is needed
        fetchApi(`/departments/${deptName}/classes/${className}/students/${rollNo}`, "GET");
    });
    
    // 6. Validate System
    document.getElementById("btn-validate-all").addEventListener("click", () => {
        fetchApi("/validate/all", "GET");
    });

});