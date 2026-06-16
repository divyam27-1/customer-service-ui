document.addEventListener("DOMContentLoaded", () => {
  // --- STATE ---
  let tickets = [];

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
      // ✅ FIXED: Updated endpoint to match backend: /api/customer/getTicketsRaisedBy
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
      row.innerHTML = `<strong>#${idToUse}</strong> <span style="float:right; font-size: 0.75rem; background: #e2e8f0; padding: 3px 8px; border-radius: 12px; font-weight:600;">${t.status}</span><div class="muted-text" style="font-size:0.9rem; margin-top:4px;">${t.description}</div>`;
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
      debitCardLast4digit: null
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
      msg.textContent = "✅ Ticket created successfully! ID: " + data.ticketId;
      raiseForm.reset();
      fillSubcategories('');
      
      // Refresh tickets array and redirect
      await fetchTickets();
      setTimeout(() => setView('viewTickets'), 1000);

    } catch (error) {
      msg.textContent = "❌ Error: " + error.message;
    }
  });

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
        msg.textContent = "✅ Request submitted. Ticket ID: " + data.ticketId;
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
        const res = await fetch("http://localhost:8619/api/cards/create", { // Ensure endpoint matches backend mapping
          method: "POST",
          credentials: "include"
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        msg.textContent = "✅ Card created successfully! Number: " + data.debitCardNumber;
      } catch (err) {
        msg.textContent = "❌ Error: " + err.message;
      }
    });
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