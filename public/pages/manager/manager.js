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
    renderTickets("PENDING_MANAGER");

  } catch (err) {
    console.error("Ticket load error:", err);
  }
}

async function fetchTicketHistory(ticketId) {
  try {
    const res = await fetch(
      `http://localhost:8619/api/cro/getTicketHistory/${ticketId}`,
      { credentials: "include" }
    );

    if (!res.ok) throw new Error("Failed to fetch history");

    const data = await res.json();

    return data;

  } catch (err) {
    console.error(err);
  }
}

// ✅ RENDER TICKETS
function renderTickets(filter) {

  // Hide details panel each time we render tickets
  document.getElementById("detailsPanel").hidden = true;

  const list = document.getElementById("ticketList");
  list.innerHTML = "";

  let filtered = tickets;

  if (filter !== "ALL") {
    filtered = tickets.filter(t => t.status === filter);
  }

  if (!filtered.length) {
    list.innerHTML = "<p>No tickets found</p>";
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

    div.onclick = () => renderDetails(t);

    list.appendChild(div);
  });
}

async function renderDetails(ticket) {
  selectedTicket = ticket;

  document.getElementById("detailsPanel").hidden = false;

  document.getElementById("userAvatar").textContent = "U";
  document.getElementById("userName").textContent = "User ID: " + ticket.userId;
  document.getElementById("userEmail").textContent = "-";

  document.getElementById("ticketCategoryCompact").textContent = `${ticket.category} (${ticket.subcategory})`;
  document.getElementById("ticketStatusCompact").textContent = ticket.status;

  await renderSelectedTicketHistory();
}

async function renderSelectedTicketHistory() {

  const ticketsData = await fetchTicketHistory(selectedTicket.ticketId);

  if (!ticketsData || !ticketsData.ticketDetails) {
    console.error("Invalid history data", ticketsData);
    return;
  }

  const list = document.getElementById("historyList");
  list.innerHTML = "";

  const ticket = ticketsData.ticketDetails;
  const history = ticketsData.ticketHistory || [];

  // Disable action panel if ticket is closed
  if (ticket.status === "CLOSED_RESOLVED" || ticket.status === "CLOSED_REJECTED") {
    document.getElementById("croActionPanel").hidden = true;
  } else {
    document.getElementById("croActionPanel").hidden = false;
  }

  /* ✅ FIRST ITEM */
  const first = document.createElement("div");
  first.className = "history-item left";

  first.innerHTML = `
    <div class="history-avatar">U</div>

    <div>
      <div class="history-bubble">
        ${ticket.description || "No description provided"}
      </div>
      <div class="history-time">
        ${new Date(ticket.dateOfSubmission).toLocaleString()}
      </div>
    </div>
  `;

  list.appendChild(first);

  /* ✅ REST */
  history.forEach(item => {

    const isUser = item.servicedBy === ticket.userId;
    const sideClass = isUser ? "left" : "right";
    const avatar = isUser ? "U" : "C";

    const div = document.createElement("div");
    div.className = `history-item ${sideClass}`;

    div.innerHTML = `
      <div class="history-avatar">${avatar}</div>

      <div>

        ${item.oldStatus && item.newStatus ? `
          <div class="history-status">
            ${item.oldStatus} → ${item.newStatus}
          </div>
        ` : ""}

        <div class="history-bubble">
          ${item.comment || "-"}
        </div>

        <div class="history-time">
          ${new Date(item.dateOfService).toLocaleString()}
        </div>
      </div>
    `;

    list.appendChild(div);
  });
}

// ✅ PERFORM ACTION (CORE LOGIC)
async function performAction(action) {

  if (!selectedTicket) return;

  const comment = document.getElementById("commentInput").value;

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

    document.getElementById("commentInput").value = "";

  } catch (err) {
    alert("❌ " + err.message);
  }
}

// ✅ BUTTON ACTIONS
document.getElementById("markCompleteBtn").onclick = async () => {
  await performAction("RESOLVE");
  await renderSelectedTicketHistory();
  await loadAllTickets();
}

document.getElementById("markPendingBtn").onclick = async () => {
  await performAction("RETURN_TO_CUSTOMER");
  await renderSelectedTicketHistory();
  await loadAllTickets();
}

document.getElementById("markRejectedBtn").onclick = async () => {
  await performAction("REJECT");
  await renderSelectedTicketHistory();
  await loadAllTickets();
}

document.getElementById("addCommentBtn").onclick = async () => {
  await performAction("COMMENT");
  await renderSelectedTicketHistory();
}

// Action buttons should be enabled only when we enter text into textbox
function toggleActionButtons() {
  const hasText = document.getElementById("commentInput").value.trim().length > 0;

  document.getElementById("addCommentBtn").disabled = !hasText;
  document.getElementById("markCompleteBtn").disabled = !hasText;
  document.getElementById("markPendingBtn").disabled = !hasText;
  document.getElementById("markRejectedBtn").disabled = !hasText;
}

document.getElementById("commentInput").addEventListener("input", toggleActionButtons);

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


// ---------------------------UI MANAGER COLOR CHANGE FOR SELECTED BUTTON----------------------------

// --- FILTER BUTTON ACTIVE STATE LOGIC ---
const filterButtons = document.querySelectorAll('.filters .filter-btn');

filterButtons.forEach(button => {
  button.addEventListener('click', function() {
    // 1. Remove the 'active' class from ALL filter buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // 2. Add the 'active' class to the exact button you just clicked
    this.classList.add('active');
  });
});