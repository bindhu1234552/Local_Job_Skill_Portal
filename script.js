"use strict";

// Google Apps Script Web App URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwsMi1G0d5w9AXM15Kk6yfnOQ58bUoqatWGun98SfOUJ5mLwPPivRW5US7kjUu-C_u7Hg/exec";

const $ = (id) => document.getElementById(id);

const KEYS = {
  workers: "localPortalWorkers",
  jobs: "localPortalJobs"
};

let allJobs = [];

function readData(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function showMessage(id, message, type = "info") {
  const element = $(id);
  if (!element) return;

  element.textContent = message;
  element.className = "message " + type;
}

function validPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone).trim());
}

async function sendToDatabase(type, data) {
  if (!SCRIPT_URL) {
    throw new Error("Google Apps Script URL is missing.");
  }

  await fetch(SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ ...data, type })
  });
}

function updateCounters() {
  if ($("workerCount")) {
    $("workerCount").textContent = readData(KEYS.workers).length;
  }

  if ($("jobCount")) {
    $("jobCount").textContent = allJobs.length;
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderJobs(list = allJobs) {
  const container = $("jobResults");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <span>🔎</span>
        <h3>No jobs found</h3>
        <p>Try another skill or location, or check again later.</p>
      </div>`;
    if ($("resultCount")) $("resultCount").textContent = "0 jobs";
    return;
  }

  if ($("resultCount")) {
    $("resultCount").textContent =
      `${list.length} job${list.length === 1 ? "" : "s"} found`;
  }

  container.innerHTML = list.map((job, index) => `
    <article class="job-card">
      <h3>${escapeHTML(job.title)}</h3>
      <div class="job-meta">
        <span class="pill">${escapeHTML(job.skill)}</span>
        <span class="pill">📍 ${escapeHTML(job.location)}</span>
      </div>
      <p class="job-pay">${escapeHTML(job.payment || "Payment negotiable")}</p>
      <p class="job-description">${escapeHTML(job.description || "Contact the employer for more details.")}</p>
      <p class="job-contact">📞 Employer: ${escapeHTML(job.phone || "Contact details unavailable")}</p>
      <button
        type="button"
        class="btn request-job-btn"
        data-index="${index}"
        data-title="${escapeHTML(job.title)}"
        data-phone="${escapeHTML(job.phone || "")}">
        Request Job
      </button>
    </article>
  `).join("");
}

async function loadJobsFromDatabase() {
  // Google Apps Script JSONP callback for reading jobs
  return new Promise((resolve, reject) => {
    const callbackName =
      "portalJobsCallback_" + Date.now() + "_" +
      Math.floor(Math.random() * 10000);

    const script = document.createElement("script");
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Could not load jobs from Google Sheets."));
    }, 10000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (response) => {
      cleanup();

      if (response && Array.isArray(response.jobs)) {
        resolve(response.jobs);
      } else {
        reject(new Error("Invalid jobs response."));
      }
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Unable to connect to the database."));
    };

    script.src =
      SCRIPT_URL +
      "?action=jobs&callback=" +
      encodeURIComponent(callbackName) +
      "&t=" + Date.now();

    document.body.appendChild(script);
  });
}

async function refreshJobs() {
  try {
    const jobs = await loadJobsFromDatabase();

    allJobs = jobs.map((job) => ({
      title: job.title || job.jobTitle || "",
      skill: job.skill || "",
      location: job.location || "",
      payment: job.payment || "",
      phone: job.phone || job.employerPhone || "",
      description: job.description || ""
    }));

    saveLocal(KEYS.jobs, allJobs);
  } catch (error) {
    // Show previously saved jobs if the database cannot be reached.
    allJobs = readData(KEYS.jobs);
  }

  renderJobs();
  updateCounters();
}

function searchJobs() {
  const skill = $("searchSkill")?.value || "all";
  const location = ($("searchLocation")?.value || "")
    .trim().toLowerCase();

  const filtered = allJobs.filter((job) => {
    const skillMatches =
      skill === "all" ||
      job.skill.toLowerCase() === skill.toLowerCase();

    const locationMatches =
      !location ||
      job.location.toLowerCase().includes(location);

    return skillMatches && locationMatches;
  });

  renderJobs(filtered);

  if ($("jobsMessage")) {
    showMessage(
      "jobsMessage",
      filtered.length ? "" : "No matching jobs. Try another search.",
      filtered.length ? "success" : "info"
    );
  }
}

function clearSearch() {
  if ($("searchSkill")) $("searchSkill").value = "all";
  if ($("searchLocation")) $("searchLocation").value = "";
  if ($("jobsMessage")) showMessage("jobsMessage", "");
  renderJobs();
}

function setupWorkerForm() {
  const form = $("workerForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const worker = {
      name: $("workerName")?.value.trim() || "",
      phone: $("phone")?.value.trim() || "",
      skill: $("skill")?.value || "",
      location: $("location")?.value.trim() || "",
      experience: $("experience")?.value || ""
    };

    if (
      !worker.name ||
      !worker.phone ||
      !worker.skill ||
      !worker.location ||
      !worker.experience
    ) {
      showMessage("workerMessage", "Please fill in all required fields.", "error");
      return;
    }

    if (!validPhone(worker.phone)) {
      showMessage("workerMessage", "Enter a valid 10-digit mobile number.", "error");
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      await sendToDatabase("worker", worker);

      const workers = readData(KEYS.workers);
      workers.push({ ...worker, savedAt: new Date().toISOString() });
      saveLocal(KEYS.workers, workers);

      showMessage(
        "workerMessage",
        "Registration submitted. Please check the Worker registration sheet to confirm it was saved.",
        "success"
      );

      form.reset();
      updateCounters();
    } catch (error) {
      showMessage(
        "workerMessage",
        "Could not send registration. Check your internet and Apps Script URL.",
        "error"
      );
    } finally {
      if (button) button.disabled = false;
    }
  });
}

function setupJobForm() {
  const form = $("jobForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const job = {
      title: $("jobTitle")?.value.trim() || "",
      skill: $("jobSkill")?.value || "",
      location: $("jobLocation")?.value.trim() || "",
      payment: $("payment")?.value.trim() || "",
      phone: $("employerPhone")?.value.trim() || "",
      description: $("description")?.value.trim() || ""
    };

    if (
      !job.title ||
      !job.skill ||
      !job.location ||
      !job.payment ||
      !job.phone ||
      !job.description
    ) {
      showMessage("jobMessage", "Please fill in all required fields.", "error");
      return;
    }

    if (!validPhone(job.phone)) {
      showMessage("jobMessage", "Enter a valid 10-digit employer contact number.", "error");
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      await sendToDatabase("job", job);

      allJobs.push(job);
      saveLocal(KEYS.jobs, allJobs);

      showMessage(
        "jobMessage",
        "Job submitted. Check the Jobs sheet to confirm it was saved.",
        "success"
      );

      form.reset();
      renderJobs();
      updateCounters();
    } catch (error) {
      showMessage(
        "jobMessage",
        "Could not submit job. Check your internet and Apps Script URL.",
        "error"
      );
    } finally {
      if (button) button.disabled = false;
    }
  });
}
function setupJobRequests() {
  document.addEventListener("click", async function (event) {
    const button = event.target.closest(".request-job-btn");
    if (!button) return;

    const oldForm = document.getElementById("requestFormBox");
    if (oldForm) oldForm.remove();

    const title = button.dataset.title || "";
    const phone = button.dataset.phone || "";

    const box = document.createElement("div");
    box.id = "requestFormBox";
    box.style.cssText =
      "position:fixed;inset:0;background:#0008;z-index:99999;" +
      "display:flex;align-items:center;justify-content:center;padding:20px";

    box.innerHTML = `
      <div style="background:white;color:#222;padding:24px;border-radius:12px;width:100%;max-width:360px">
        <h3>Request This Job</h3>
        <p>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        <form id="jobRequestForm">
          <label>Your full name</label>
          <input id="requestName" required style="display:block;width:100%;padding:10px;margin:8px 0 16px;box-sizing:border-box">
          <label>Your 10-digit mobile number</label>
          <input id="requestPhone" type="tel" inputmode="numeric" pattern="[0-9]{10}" maxlength="10" required style="display:block;width:100%;padding:10px;margin:8px 0 16px;box-sizing:border-box">
          <button type="submit">Submit Request</button>
          <button type="button" id="cancelRequest">Cancel</button>
          <p id="requestFormMessage"></p>
        </form>
      </div>`;

    document.body.appendChild(box);

    box.querySelector("#cancelRequest").onclick = () => box.remove();

    box.querySelector("#jobRequestForm").onsubmit = async function (e) {
      e.preventDefault();

      const senderName = box.querySelector("#requestName").value.trim();
      const senderPhone = box.querySelector("#requestPhone").value.trim();
      const message = box.querySelector("#requestFormMessage");
      const submitButton = this.querySelector('[type="submit"]');

      if (!validPhone(senderPhone)) {
        message.textContent = "Enter a valid 10-digit mobile number.";
        return;
      }

      submitButton.disabled = true;
      message.textContent = "Submitting request...";

      try {
        await sendToDatabase("request", {
          senderName,
          senderPhone,
          jobTitle: title,
          employerPhone: phone,
          skill: "",
          location: "",
          status: "Pending"
        });

        message.textContent = "Request sent. Check the Request sheet to confirm it saved.";
      } catch (error) {
        message.textContent = "Request failed: " + error.message;
      } finally {
        submitButton.disabled = false;
      }
    };
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupWorkerForm();
  setupJobForm();
  setupJobRequests();
  console.log("Request handler attached:", $("jobResults"));

  if ($("searchButton")) {
    $("searchButton").addEventListener("click", searchJobs);
  }

  if ($("clearSearch")) {
    $("clearSearch").addEventListener("click", clearSearch);
  }

  if ($("searchLocation")) {
    $("searchLocation").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        searchJobs();
      }
    });
  }

  refreshJobs();
});