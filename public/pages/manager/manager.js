let tickets = [];
let selectedTicket = null;

// ✅ LOAD DEFAULT DATA
document.addEventListener("DOMContentLoaded", () => {
  loadAllTickets();
  loadSLA();
  loadManagerProfile();
});


// ✅ FETCH ALL TICKETS (combine APIs)
async function loadAllTickets() {
  try {
    const endpoints = [
      "getPending",
      "getActive",
      "getEscalated",
      "getResolved",
      "getRejected"
    ];

    let all = [];

    for (let ep of endpoints) {
      const res = await fetch(`http://localhost:8619/api/admin/${ep}`, {
        credentials: "include"
      });

      if (res.ok) {
        const data = await res.json();
        all = all.concat(data);
      }
    }

    tickets = all;
    renderTickets("ALL");

  } catch (err) {
    console.error("Ticket load error:", err);
  }
}


// ✅ RENDER TICKETS
function renderTickets(filter) {
  const list = document.getElementById("ticketList");
  list.innerHTML = "";

  let filtered = tickets;

  if (filter !== "ALL") {
    filtered = tickets.filter(t => t.status === filter);
  }

  if (!filtered.length) {
    list.innerHTML = "<p>No tickets found</p>";
    document.getElementById("detailsPanel").hidden = true;
    return;
  }

  filtered.forEach(t => {
    const div = document.createElement("div");
    div.className = "ticket";

    div.innerHTML = `
      <b>${t.category} → ${t.subcategory}</b><br>
      ID: ${t.ticketId} | ${t.status}<br>
      ${new Date(t.dateOfSubmission).toLocaleDateString()}
    `;

    div.onclick = () => showDetails(t);

    list.appendChild(div);
  });
}


// ✅ SHOW DETAILS
function showDetails(ticket) {
  selectedTicket = ticket;

  document.getElementById("detailsPanel").hidden = false;

  document.getElementById("ticketId").textContent = ticket.ticketId;
  document.getElementById("ticketUser").textContent = ticket.userId;
  document.getElementById("ticketCategory").textContent = ticket.category;
  document.getElementById("ticketSubcategory").textContent = ticket.subcategory;
  document.getElementById("ticketStatus").textContent = ticket.status;
  document.getElementById("ticketDescription").textContent = ticket.description;
}


// ✅ PERFORM ACTION (CORE LOGIC)
async function performAction(action) {

  if (!selectedTicket) return;

  const comment = document.getElementById("commentBox").value;

  try {
    const res = await fetch("http://localhost:8619/api/cro/raiseService", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        ticketId: selectedTicket.ticketId,
        serviceAction: action,
        comment: comment
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    document.getElementById("commentBox").value = "";

    await loadAllTickets(); // refresh

  } catch (err) {
    alert("❌ " + err.message);
  }
}


// ✅ SWITCH PAGES
// Function to switch pages and update sidebar buttons
function showPage(pageId) {
  // 1. Hide all pages
  document.getElementById('dashboardPage').hidden = true;
  document.getElementById('slaPage').hidden = true;

  // 2. Show the specific page the user clicked
  document.getElementById(pageId + 'Page').hidden = false;

  // 3. Remove the "active" class from ALL sidebar buttons
  const navButtons = document.querySelectorAll('.sidebar .nav button');
  navButtons.forEach(btn => {
    btn.classList.remove('active');
  });

  // 4. Find the exact button that was just clicked and add "active" to it
  const clickedButton = document.querySelector(`.sidebar .nav button[onclick="showPage('${pageId}')"]`);
  if (clickedButton) {
    clickedButton.classList.add('active');
  }
}


// ✅ LOAD SLA / CRO DASHBOARD
async function loadSLA() {
  try {
    const res = await fetch("http://localhost:8619/api/admin/cro-dashboard", {
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();

    let total = 0, pending = 0, resolved = 0, rejected = 0;

    const table = document.getElementById("croTable");
    table.innerHTML = "";

    data.forEach(cro => {
      total += cro.totalTickets;
      pending += cro.pendingCro;
      resolved += cro.resolved;
      rejected += cro.rejected;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${cro.croName}</td>
        <td>${cro.totalTickets}</td>
        <td>${cro.pendingCro}</td>
        <td>${cro.pendingManager}</td>
        <td>${cro.resolved}</td>
        <td>${cro.rejected}</td>
      `;
      table.appendChild(row);
    });

    document.getElementById("slaTotal").textContent = total;
    document.getElementById("slaPending").textContent = pending;
    document.getElementById("slaResolved").textContent = resolved;
    document.getElementById("slaRejected").textContent = rejected;

  } catch (err) {
    console.error("SLA load error:", err);
  }
}


// ✅ LOAD MANAGER PROFILE
async function loadManagerProfile() {
  try {
    const res = await fetch("http://localhost:8619/api/user/profile", {
      credentials: "include"
    });

    if (!res.ok) return;

    const user = await res.json();

    document.getElementById("managerName").textContent =
      user.firstName + " " + user.lastName;

    document.getElementById("managerEmail").textContent =
      user.emailId;

  } catch (err) {
    console.error(err);
  }
}


// ✅ LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async () => {

  await fetch("http://localhost:8619/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });

  document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  window.location.href = "../login.html";
});