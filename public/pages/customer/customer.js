document.addEventListener("DOMContentLoaded", () => {

  let tickets = [];

  const ticketListEl = document.getElementById('ticketList');
  const ticketsContainer = document.getElementById('ticketsContainer');

  function renderTickets() {
    ticketListEl.innerHTML = '';
    ticketsContainer.innerHTML = '';

    if (!tickets.length) {
      ticketListEl.innerHTML = '<div class="ticket">No tickets yet</div>';
      ticketsContainer.innerHTML = '<div class="ticket">No tickets yet</div>';
    } else {
      tickets.forEach(t => {
        const el = document.createElement('div');
        el.className = 'ticket';
        el.innerHTML = `<strong>#${t.id}</strong><div>${t.category} → ${t.subcategory}</div>`;
        ticketListEl.appendChild(el);

        const row = document.createElement('div');
        row.className = 'ticket';
        row.innerHTML = `<strong>#${t.id} — ${t.status}</strong>`;
        ticketsContainer.appendChild(row);
      });
    }

    const openTickets = tickets.filter(t => t.status === "OPEN").length;
    const closedTickets = tickets.filter(t => t.status === "CLOSED").length;

    document.getElementById("openCount").textContent = openTickets;
    document.getElementById("closedCount").textContent = closedTickets;
  }

  async function fetchTickets() {
    const res = await fetch("http://localhost:8619/api/customer/getTickets", {
      credentials: "include"
    });

    const data = await res.json();
    tickets = data;

    renderTickets();
  }

  async function loadUser() {
    const res = await fetch("http://localhost:8619/api/user/profile", {
      credentials: "include"
    });

    const user = await res.json();

    document.getElementById("userName").textContent =
      user.firstName + " " + user.lastName;

    document.getElementById("userEmail").textContent =
      user.emailId;
  }

  // ✅ SAFE EVENT LISTENERS
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = "../login.html";
    });
  }

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", fetchTickets);
  }

  const newBtn = document.getElementById("newTicketBtn");
  if (newBtn) {
    newBtn.addEventListener("click", () => {
      document.querySelector('[data-target="raiseTicket"]').click();
    });
  }

  // ✅ LOAD DATA
  loadUser();
  fetchTickets();

});


// Create Debit Card       ----------------------------------------------

const createCardBtn = document.getElementById("createCardBtn");

if (createCardBtn) {
  createCardBtn.addEventListener("click", async () => {

    const msg = document.getElementById("createCardMsg");

    try {
      const res = await fetch("http://localhost:8619/api/cards", {
        method: "POST",
        credentials: "include"  // ✅ send JWT cookie
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();

      msg.textContent = "✅ Card created successfully: " + data.debitCardNumber;

      // ✅ OPTIONAL: refresh tickets/cards UI
      fetchTickets();

    } catch (err) {
      msg.textContent = "❌ " + err.message;
    }

  });
}



// ---------GET ALL TICKETS OF CUSTOMER ---------------------------

async function fetchTickets() {
  try {
    console.log("Fetching tickets...");

    const res = await fetch("http://localhost:8619/api/customer/getTickets", {
      method: "GET",
      credentials: "include"
    });

    console.log("Response status:", res.status);

    const data = await res.json();
    console.log("Data:", data);

    tickets = data;
    renderTickets();

    console.log("Tickets have been rendered");

  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}


// LOg out function --------------------------------------------

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await fetch("http://localhost:8619/api/auth/logout", {
      method: "POST",
      credentials: "include"
    });

  } catch (e) {
    console.error("Logout failed");
  }

  // 🧹 clear cookies manually if needed
  document.cookie = "jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

  window.location.href = "../login.html";
});


// -----------------------------------------------------------------


async function loadUser() {
  try {
    const res = await fetch("http://localhost:8619/api/user/profile", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) throw new Error("User API failed");

    const user = await res.json();

    document.getElementById("userName").textContent =
      (user.firstName || "") + " " + (user.lastName || "");

    document.getElementById("userEmail").textContent =
      user.emailId || "No email";

  } catch (err) {
    console.error("User load failed:", err);
  }
}

// ----------------------------------------------------------------------


(function () {
  const nav = document.getElementById('sideNav');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('pageTitle');

  function setView(id){
    views.forEach(v => { v.hidden = v.id !== id; });
    nav.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.target === id));
    const btn = document.querySelector('[data-target="'+id+'"]');
    pageTitle.textContent = id === 'dashboard' ? 'Overview' : (btn ? btn.textContent : 'Dashboard');
    renderTickets();
  }



  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    setView(btn.dataset.target);
  });

  document.getElementById('newTicketBtn').addEventListener('click', () => setView('raiseTicket'));
  document.getElementById('refreshBtn').addEventListener('click', () => fetchTickets());

  const subMap = {
    "Internet Banking": ["Password reset","Login issue","Account unlocks"],
    "Account Services": ["Statement request","Address update","Mobile number update"],
    "Complaints": ["Transaction dispute","Service complaint","General feedback"]
  };

  const categoryEl = document.getElementById('category');
  const subEl = document.getElementById('subcategory');

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

//   -------------------------------RAISE TICKET LOGIC ------------------------------

const raiseForm = document.getElementById('raiseForm');

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
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",   // ✅ THIS IS KEY
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();

    msg.textContent = "✅ Ticket created successfully! ID: " + data.ticketId;

    raiseForm.reset();
    fillSubcategories('');

    setTimeout(() => setView('viewTickets'), 500);

  } catch (error) {
    msg.textContent = "❌ Error: " + error.message;
  }
});

  const cardTypeEl = document.getElementById('cardServiceType');
  const lostFields = document.getElementById('lostFields');
  cardTypeEl.addEventListener('change', () => {
    lostFields.hidden = cardTypeEl.value !== 'Lost card reporting';
  });


//   -------------------DEBIT CARD SERVICE REQUEST ------------------------------

        const cardForm = document.getElementById("cardForm");

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
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
            const err = await res.text();
            throw new Error(err);
            }

            const data = await res.json();

            msg.textContent = "✅ Request submitted. Ticket ID: " + data.ticketId;

            cardForm.reset();

        } catch (err) {
            msg.textContent = "❌ " + err.message;
        }
        });

        // ----------------------------------------------------------------------------

  const updateForm = document.getElementById('updateForm');
  updateForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('updateMsg');
    msg.textContent = 'Change request submitted (UI demo).';
    updateForm.reset();
  });

  fillSubcategories('');
  setView('dashboard');
})();

loadUser();
fetchTickets();