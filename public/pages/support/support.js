let tickets = [];
let selectedTicket = null;

// ✅ LOAD TICKETS FROM BACKEND
async function fetchTickets() {
  try {
    const res = await fetch("http://localhost:8619/api/cro/getTicketsAssignedTo", {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to fetch tickets");

    const data = await res.json();
    tickets = data;

    renderTickets("all");

  } catch (err) {
    console.error(err);
  }
}

// ✅ STATUS MAPPING (backend → UI)
function mapStatus(status) {
  switch (status) {
    case "PENDING_CUSTOMER": return "pending";
    case "PENDING_CRO": return "new";
    case "PENDING_MANAGER": return "pending";
    case "CLOSED_RESOLVED": return "completed";
    case "CLOSED_REJECTED": return "completed";
    default: return "pending";
  }
}

// ✅ RENDER TICKET LIST
function renderTickets(filter = "all") {
  const list = document.getElementById("ticketList");
  list.innerHTML = "";

  let filtered = tickets;

  if (filter !== "all") {
    filtered = tickets.filter(t => mapStatus(t.status) === filter);
  }

  if (!filtered.length) {
    list.innerHTML = `<div class="muted" style="margin-top:30px;text-align:center;">No tickets found.</div>`;
    document.getElementById("detailsPanel").hidden = true;
    return;
  }

  filtered.forEach(t => {
    const div = document.createElement("div");

    div.className = "ticket-item" + (selectedTicket && selectedTicket.ticketId === t.ticketId ? " selected" : "");

    div.innerHTML = `
      <div class="subject">${t.category} → ${t.subcategory}</div>
      <div class="meta">
        <span>${t.ticketId}</span>
        <span>${t.status}</span>
        <span>${new Date(t.dateOfSubmission).toLocaleDateString()}</span>
      </div>
      <div class="user">User ID: ${t.userId}</div>
    `;

    div.onclick = () => showDetails(t);
    list.appendChild(div);
  });
}

// ✅ SHOW DETAILS
function showDetails(ticket) {
  selectedTicket = ticket;

  document.getElementById("detailsPanel").hidden = false;

  document.getElementById("userAvatar").textContent = "U";
  document.getElementById("userName").textContent = "User ID: " + ticket.userId;
  document.getElementById("userEmail").textContent = "-";

  document.getElementById("ticketId").textContent = ticket.ticketId;
  document.getElementById("ticketCategory").textContent = ticket.category;
  document.getElementById("ticketSubcategory").textContent = ticket.subcategory;
  document.getElementById("ticketStatus").textContent = ticket.status;
  document.getElementById("ticketDate").textContent =
    new Date(ticket.dateOfSubmission).toLocaleString();
  document.getElementById("ticketDescription").textContent = ticket.description;

  renderTickets(document.querySelector(".ticket-filters button.active").dataset.filter);
}

// CALL SERVICE ACTION API
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

    const updated = await res.json();

    document.getElementById("commentInput").value = "";

    // ✅ Refresh tickets
    await fetchTickets();

  } catch (err) {
    alert("❌ " + err.message);
  }
}

// ✅ BUTTON ACTIONS
document.getElementById("markCompleteBtn").onclick = () => performAction("RESOLVE");
document.getElementById("markPendingBtn").onclick = () => performAction("RETURN_TO_CUSTOMER");
document.getElementById("addCommentBtn").onclick = () => performAction("COMMENT");

// ✅ FILTER BUTTONS
document.querySelectorAll(".ticket-filters button").forEach(btn => {
  btn.onclick = function () {
    document.querySelectorAll(".ticket-filters button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderTickets(btn.dataset.filter);
    document.getElementById("detailsPanel").hidden = true;
    selectedTicket = null;
  };
});

// ✅ LOGOUT
document.querySelector(".muted-link")?.addEventListener("click", async () => {
  await fetch("http://localhost:8619/api/auth/logout", {
    method: "POST",
    credentials: "include"
  });
});

// ✅ INIT
document.addEventListener("DOMContentLoaded", fetchTickets);