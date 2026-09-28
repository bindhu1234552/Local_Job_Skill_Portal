// =========================================================
// Local Job & Skill Matching Portal
// Complete script.js
// =========================================================


// =========================================================
// 1. WORKER REGISTRATION
// =========================================================

const workerForm = document.getElementById("workerForm");

if (workerForm) {
    workerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("workerName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const skill = document.getElementById("skill").value;
        const location = document.getElementById("location").value.trim();
        const experience = document.getElementById("experience").value;

        if (name === "" || phone === "" || skill === "" || location === "") {
            showMessage("workerMessage", "Please fill in all required fields.", "error");
            return;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            showMessage("workerMessage", "Please enter a valid 10-digit phone number.", "error");
            return;
        }

        const worker = {
            name: name,
            phone: phone,
            skill: skill,
            location: location,
            experience: experience
        };

        let workers = JSON.parse(localStorage.getItem("workers")) || [];
        workers.push(worker);
        localStorage.setItem("workers", JSON.stringify(workers));

        showMessage(
            "workerMessage",
            "Registration successful! Welcome, " + name + ".",
            "success"
        );

        workerForm.reset();
    });
}


// =========================================================
// 2. JOB SEARCH
// =========================================================

function searchJobs() {

    const selectedSkill =
        document.getElementById("searchSkill").value.toLowerCase();

    const selectedLocation =
        document.getElementById("searchLocation").value.trim().toLowerCase();

    const jobs = document.querySelectorAll(".job");

    let foundJobs = 0;

    jobs.forEach(function (job) {

        const jobSkill =
            (job.getAttribute("data-skill") || "").toLowerCase();

        const jobLocation =
            (job.getAttribute("data-location") || "").toLowerCase();

        const skillMatches =
            selectedSkill === "" || jobSkill === selectedSkill;

        const locationMatches =
            selectedLocation === "" ||
            jobLocation.includes(selectedLocation);

        if (skillMatches && locationMatches) {
            job.style.display = "block";
            foundJobs++;
        } else {
            job.style.display = "none";
        }
    });

    const oldMessage = document.getElementById("searchMessage");

    if (oldMessage) {
        oldMessage.remove();
    }

    const message = document.createElement("p");

    message.id = "searchMessage";

    if (foundJobs === 0) {
        message.className = "error";
        message.textContent =
            "No matching jobs found. Try another skill or location.";
    } else {
        message.className = "success";
        message.textContent =
            foundJobs + " job(s) found.";
    }

    document.getElementById("jobResults").prepend(message);
}


const searchButton = document.querySelector("#search button");

if (searchButton) {
    searchButton.addEventListener("click", searchJobs);
}


// =========================================================
// 3. POST A JOB
// =========================================================

const jobForm = document.getElementById("jobForm");

if (jobForm) {

    jobForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const title = document.getElementById("jobTitle").value.trim();
        const skill = document.getElementById("jobSkill").value;
        const location = document.getElementById("jobLocation").value.trim();
        const payment = document.getElementById("payment").value.trim();
        const phone = document.getElementById("employerPhone").value.trim();
        const description = document.getElementById("description").value.trim();

        // Check required fields
        if (title === "" || skill === "" || location === "" || payment === "" || phone === "") {

            showMessage(
                "jobMessage",
                "Please fill in all required fields.",
                "error"
            );

            return;
        }

        // Check phone number
        if (!/^[0-9]{10}$/.test(phone)) {

            showMessage(
                "jobMessage",
                "Please enter a valid 10-digit contact number.",
                "error"
            );

            return;
        }

        // Check payment
        if (Number(payment) <= 0) {

            showMessage(
                "jobMessage",
                "Please enter a valid daily payment amount.",
                "error"
            );

            return;
        }

        const job = {
            title: title,
            skill: skill,
            location: location,
            payment: payment,
            phone: phone,
            description: description
        };

        let savedJobs =
            JSON.parse(localStorage.getItem("jobs")) || [];

        savedJobs.push(job);

        localStorage.setItem(
            "jobs",
            JSON.stringify(savedJobs)
        );

        addJobToPage(job);

        showMessage(
            "jobMessage",
            "Job posted successfully!",
            "success"
        );

        jobForm.reset();
    });
}


// =========================================================
// 4. ADD JOB TO PAGE
// =========================================================

function addJobToPage(job) {

    const jobResults =
        document.getElementById("jobResults");

    if (!jobResults) {
        return;
    }

    const newJob =
        document.createElement("div");

    newJob.className = "job";

    newJob.setAttribute("data-skill", job.skill);
    newJob.setAttribute("data-location", job.location);

    newJob.innerHTML = `
        <h3>${job.title}</h3>
        <p><strong>Skill:</strong> ${job.skill}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Payment:</strong> ₹${job.payment} per day</p>
        <p><strong>Contact:</strong> ${job.phone}</p>
        <p><strong>Description:</strong> ${job.description || "No description provided."}</p>
    `;

    jobResults.prepend(newJob);
}


// =========================================================
// 5. LOAD SAVED JOBS
// =========================================================

function loadSavedJobs() {

    const savedJobs =
        JSON.parse(localStorage.getItem("jobs")) || [];

    savedJobs.forEach(function (job) {
        addJobToPage(job);
    });
}


// =========================================================
// 6. MESSAGE FUNCTION
// =========================================================

function showMessage(elementId, message, type) {

    const element =
        document.getElementById(elementId);

    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = type;

    setTimeout(function () {
        element.textContent = "";
        element.className = "";
    }, 5000);
}


// =========================================================
// 7. APPLY NOW BUTTON
// =========================================================

document.addEventListener("click", function (event) {

    if (event.target.matches(".job-card button")) {

        alert("Application submitted successfully!");

    }

});


// =========================================================
// 8. LOAD SAVED JOBS WHEN PAGE OPENS
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    loadSavedJobs();

});