document.addEventListener("DOMContentLoaded", () => {
  // --- STATE ---
  let tickets = [];
  let selectedTicket = null;

  // --- DOM ELEMENTS ---
  const nav = document.getElementById('sideNav');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('pageTitle');
  
  const ticketListEl = document.getElementById('ticketList');
  const ticketsContainer = document.getElementById('ticketsContainer');
  
  const categoryEl = document.getElementById('category');
  const subEl = document.getElementById('subcategory');
  const raiseForm = document.getElementById('raiseForm');
  const cardForm = document.getElementById("cardForm");

  // --- INITIALIZATION ---
  loadUser();
  fetchTickets();
  setView('dashboard');

  loadCards(); // optional initial load

    //  attach click handler
    document.querySelector('[data-target="cardServices"]')
      ?.addEventListener("click", loadCards);


  // --- NAVIGATION LOGIC ---
  function setView(id) {
    views.forEach(v => { v.hidden = v.id !== id; });
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.target === id));
    
    const btn = document.querySelector('[data-target="' + id + '"]');
    pageTitle.textContent = id === 'dashboard' ? 'Overview' : (btn ? btn.textContent : 'Dashboard');
    
    // Only try to render tickets if the arrays have data
    renderTickets();
  }

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    setView(btn.dataset.target);
  });

  // --- API: LOAD USER PROFILE ---
  async function loadUser() {
    try {
      const res = await fetch("http://localhost:8619/api/user/profile", {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) throw new Error("User API failed");

      const user = await res.json();
      const fullName = (user.firstName || "") + " " + (user.lastName || "");

      document.getElementById("userName").textContent = fullName;
      document.getElementById("userEmail").textContent = user.emailId || "No email";

      const footerDisplay = user.firstName ? fullName : (user.emailId || "User");
      document.getElementById("userNameFooter").textContent = "Logged in as " + footerDisplay;

    } catch (err) {
      console.error("User load failed:", err);
    }
  }

  // --- API: FETCH TICKETS ---
  async function fetchTickets() {
    try {
      //  FIXED: Updated endpoint to match backend: /api/customer/getTicketsRaisedBy
      const res = await fetch("http://localhost:8619/api/customer/getTicketsRaisedBy", {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to fetch tickets");

      const data = await res.json();
      tickets = data;
      renderTickets();

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  }

  // ------------------FETCH TICKET HISTORY---------------------

  async function fetchTicketHistory(ticketId) {
  try {
    const res = await fetch(
      `http://localhost:8619/api/customer/getTicketHistory/${ticketId}`,
      { credentials: "include" }
    );

    if (!res.ok) throw new Error("Failed history");

    return await res.json();

  } catch (err) {
    console.error(err);
    return null;
  }
}

// ----------------------------------------------------

  // --- RENDER TICKETS IN UI ---
  function renderTickets() {
    ticketListEl.innerHTML = '';
    ticketsContainer.innerHTML = '';

    if (!tickets || tickets.length === 0) {
      ticketListEl.innerHTML = '<div class="ticket">No tickets yet</div>';
      ticketsContainer.innerHTML = '<div class="ticket">No tickets yet</div>';
      document.getElementById("openCount").textContent = 0;
      document.getElementById("closedCount").textContent = 0;
      document.getElementById("cardCount").textContent = 0;
      return;
    } 
    
    tickets.forEach(t => {
      const idToUse = t.ticketId || t.id || 'N/A';
      
      // Sidebar Mini List
      const el = document.createElement('div');
      el.className = 'ticket';
      el.innerHTML = `<strong>#${idToUse}</strong><div class="muted-text" style="font-size:0.8rem;">${t.category} → ${t.subcategory}</div>`;
      ticketListEl.appendChild(el);

      // Main View List

      const row = document.createElement('div');
      row.className = 'ticket';

      row.innerHTML = `
        <strong>#${idToUse}</strong> 
        <span style="float:right; font-size: 0.75rem; background: #e2e8f0; padding: 3px 8px; border-radius: 12px; font-weight:600;">
          ${t.status}
        </span>
        <div class="muted-text" style="font-size:0.9rem; margin-top:4px;">
          ${t.description}
        </div>
      `;

      row.onclick = () => {
        document.querySelectorAll('#ticketsContainer .ticket')
          .forEach(el => el.classList.remove('active'));

        row.classList.add('active');

        renderCustomerDetails(t);
      };




      ticketsContainer.appendChild(row);
    });

    const closedTickets = tickets.filter(t => 
      t.status === "CLOSED_RESOLVED" || 
      t.status === "CLOSED_REJECTED" || 
      t.status === "CLOSED" 
    ).length;

    const openTickets = tickets.length - closedTickets;
    const cardRequests = tickets.filter(t => t.category === "DEBITCARDSERVICE").length;

    document.getElementById("openCount").textContent = openTickets;
    document.getElementById("closedCount").textContent = closedTickets;
    document.getElementById("cardCount").textContent = cardRequests;
  }

  // --- FORM CATEGORY LOGIC ---
  const subMap = {
    "Internet Banking": ["Password reset","Login issue","Account unlocks"],
    "Account Services": ["Statement request","Address update","Mobile number update"],
    "Complaints": ["Transaction dispute","Service complaint","General feedback"]
  };

  function fillSubcategories(cat){
    subEl.innerHTML = '<option value="">Select subcategory</option>';
    (subMap[cat] || []).forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      subEl.appendChild(opt);
    });
  }
  categoryEl.addEventListener('change', () => fillSubcategories(categoryEl.value));

  // --- API: RAISE TICKET SUBMIT ---
  raiseForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    const categoryUI = categoryEl.value;
    const subcategoryUI = subEl.value;
    const description = document.getElementById('description').value.trim();
    const msg = document.getElementById('raiseMsg');

    if (!categoryUI || !subcategoryUI || !description) {
      msg.textContent = 'Please select Category, Subcategory, and enter Description.';
      return;
    }

    const categoryMap = {
      "Internet Banking": "INTERNETBANKING",
      "Account Services": "ACCOUNTSERVICE",
      "Complaints": "COMPLAINT"
    };

    const subcategoryMap = {
      "Password reset": "RESETPASSWORD",
      "Login issue": "LOGINISSUE",
      "Account unlocks": "UNLOCKACCOUNT",
      "Statement request": "REQUESTSTATEMENT",
      "Address update": "UPDATEADDRESS",
      "Mobile number update": "UPDATEMOBILENUMBER",
      "Transaction dispute": "TRANSACTIONDISPUTE",
      "Service complaint": "SERVICECOMPLAINT",
      "General feedback": "GENERALFEEDBACK"
    };

    const requestBody = {
      category: categoryMap[categoryUI],
      subcategory: subcategoryMap[subcategoryUI],
      description: description,
      debitCardLast4Digits: null
    };

    try {
      const response = await fetch("http://localhost:8619/api/customer/raiseTicket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      msg.textContent = " Ticket created successfully! ID: " + data.ticketId;
      raiseForm.reset();
      fillSubcategories('');
      
      // Refresh tickets array and redirect
      await fetchTickets();
      setTimeout(() => setView('viewTickets'), 1000);

    } catch (error) {
      msg.textContent = "❌ Error: " + error.message;
    }
  });


  // ------------------------ RENDER TICKET COMMENT ---------------------

      document.getElementById("sendCommentBtn").onclick = async () => {

      if (!selectedTicket) return;

      const msg = document.getElementById("custCommentInput").value.trim();
      if (!msg) return;

      let action = "COMMENT"; // default

      // ✅ ONLY when PENDING_CUSTOMER → allow escalation
      if (selectedTicket.status === "PENDING_CUSTOMER") {
        action = "ESCALATE_TO_CRO";
      }
      console.log("Action determined:", action);

      try {
        const res = await fetch("http://localhost:8619/api/customer/raiseService", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({
            ticketId: selectedTicket.ticketId,
            serviceAction: action,
            comment: msg
          })
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(err);
        }

        document.getElementById("custCommentInput").value = "";

        await renderCustomerHistory();
        await fetchTickets(); // ✅ refresh status

      } catch (err) {
        alert("❌ " + err.message);
      }
    };

// ----------------------RENDER CUSTOMER DETAIL--------------------

async function renderCustomerDetails(ticket) {

  if (!ticket) return;

  const input = document.getElementById("custCommentInput");
  const btn = document.getElementById("sendCommentBtn");

  // ✅ CLOSED → disable everything
  if (ticket.status === "CLOSED_RESOLVED" || ticket.status === "CLOSED_REJECTED") {
    input.disabled = true;
    btn.disabled = true;
  }

  // ✅ CUSTOMER CAN ESCALATE
  else if (ticket.status === "PENDING_CUSTOMER") {
    input.disabled = false;
    btn.disabled = false;
    btn.textContent = "Send & Escalate";
  }

  // ✅ OTHER STATES → COMMENT ONLY
  else {
    input.disabled = false;
    btn.disabled = false;
    btn.textContent = "Send Comment";
  }

  selectedTicket = ticket;

  // show panel
  document.getElementById("ticketDetailsPanel").hidden = false;

  // fill header
  document.getElementById("custTicketUser").textContent = "You";
  document.getElementById("custTicketStatus").textContent = ticket.status;

  document.getElementById("custTicketCategory").textContent =
    ticket.category + " → " + ticket.subcategory;

  await renderCustomerHistory();
}


// ------------------------RENDER CHAT HISTORY---------------------

async function renderCustomerHistory() {

  const data = await fetchTicketHistory(selectedTicket.ticketId);
  const list = document.getElementById("custHistoryList");

  list.innerHTML = "";

  if (!data || !data.ticketDetails) return;

  const ticket = data.ticketDetails;
  const history = data.ticketHistory || [];

  // ✅ FIRST MESSAGE (user)
  const first = document.createElement("div");

  first.innerHTML = `
    <div class="chat-bubble chat-left">
      ${ticket.description}
    </div>
    <div class="chat-time">
      ${new Date(ticket.dateOfSubmission).toLocaleString()}
    </div>
  `;

  list.appendChild(first);

  // ✅ REST
  history.forEach(item => {

    const isUser = item.servicedBy === ticket.userId;

    const sideClass = isUser ? "chat-left" : "chat-right";

    const div = document.createElement("div");

    div.innerHTML = `
      ${item.oldStatus && item.newStatus ? `
        <div class="chat-time">
          ${item.oldStatus} → ${item.newStatus}
        </div>
      ` : ""}

      <div class="chat-bubble ${sideClass}">
        ${item.comment || "-"}
      </div>

      <div class="chat-time">
        ${new Date(item.dateOfService).toLocaleString()}
      </div>
    `;


    list.appendChild(div);

    
  });
  list.scrollTop = list.scrollHeight;
}


  // --- API: DEBIT CARD SERVICE REQUEST ---
  if (cardForm) {
    cardForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const service = document.getElementById("cardServiceType").value;
      const cardLast4 = document.getElementById("debitCardNumber").value.trim();
      const comment = document.getElementById("cardComment").value.trim();
      const msg = document.getElementById("cardMsg");

      if (!service || !cardLast4 || cardLast4.length !== 4 || !comment) {
        msg.textContent = "Enter valid data (last 4 digits mandatory)";
        return;
      }

      const requestBody = {
        category: "DEBITCARDSERVICE",
        subcategory: service,
        description: comment,
        debitCardLast4Digits: cardLast4
      };

      try {
        const res = await fetch("http://localhost:8619/api/customer/raiseTicket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(requestBody)
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        msg.textContent = " Request submitted. Ticket ID: " + data.ticketId;
        cardForm.reset();
        await fetchTickets(); // Refresh dashboard counts

      } catch (err) {
        msg.textContent = "❌ " + err.message;
      }
    });
  }

  // --- API: CREATE DEBIT CARD BUTTON ---
  const createCardBtn = document.getElementById("createCardBtn");
  if (createCardBtn) {
    createCardBtn.addEventListener("click", async () => {
      const msg = document.getElementById("createCardMsg");
      try {
        const res = await fetch("http://localhost:8619/api/cards", { // Ensure endpoint matches backend mapping
          method: "POST",
          credentials: "include"
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        msg.textContent = " Card created successfully! Number: " + data.debitCardNumber;
      } catch (err) {
        msg.textContent = "❌ Error: " + err.message;
      }
    });
  }

  // ----------------------- FETCH + RENDER USER CARDS----------------------------------
async function loadCards() {
  try {
    const res = await fetch("http://localhost:8619/api/cards", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Failed to fetch cards");
    }

    const cards = await res.json();

    const cardList = document.getElementById("cardList");
    cardList.innerHTML = "";

    if (!cards.length) {
      cardList.innerHTML = '<div class="muted-text">No cards available</div>';
      return;
    }

    cards.forEach(card => {

    // -----------------------MASK CARD NUMBER (show only last 4 digits)----------------------
      const last4 = card.debitCardNumber.slice(-4);

      const div = document.createElement("div");
      div.className = "card-item";

      div.innerHTML = `
        <div class="card-number">**** **** **** ${last4}</div>
        <div class="card-status">Status: ${card.debitCardStatus}</div>
      `;

      cardList.appendChild(div);
    });

  } catch (err) {
    console.error("Card fetch error:", err);

    document.getElementById("cardList").innerHTML =
      '<div class="muted-text">Error loading cards</div>';
  }
}

  // --- GLOBAL ACTIONS ---
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) refreshBtn.addEventListener("click", fetchTickets);

  const newBtn = document.getElementById("newTicketBtn");
  if (newBtn) newBtn.addEventListener("click", () => setView('raiseTicket'));

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("http://localhost:8619/api/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } catch (e) {
        console.error("Logout fetch failed", e);
      }
      document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      window.location.href = "../login.html";
    });
  }
});