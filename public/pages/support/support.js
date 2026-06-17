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

  renderTickets(document.querySelector(".ticket-filters button.active").dataset.filter);

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
document.getElementById("markCompleteBtn").onclick = () => {
  performAction("RESOLVE");
  renderSelectedTicketHistory();
}

document.getElementById("markPendingBtn").onclick = () => {
  performAction("RETURN_TO_CUSTOMER");
  renderSelectedTicketHistory();
}

document.getElementById("markRejectedBtn").onclick = () => {
  performAction("REJECT");
  renderSelectedTicketHistory();
}

document.getElementById("addCommentBtn").onclick = () => {
  performAction("COMMENT");
  renderSelectedTicketHistory();
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