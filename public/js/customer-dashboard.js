function renderTickets(){
    ticketListEl.innerHTML = '';
    ticketsContainer.innerHTML = '';
    if (!tickets.length){
      ticketListEl.innerHTML = '<div class="ticket">No tickets yet. Use Raise ticket to create one.</div>';
      ticketsContainer.innerHTML = '<div class="ticket">No tickets yet.</div>';
    } else {
      tickets.slice().reverse().forEach(t => {
        const el = document.createElement('div');
        el.className = 'ticket';
        el.innerHTML = '<strong>#'+t.id+'</strong><div class="muted" style="margin-top:6px">'+t.category+' → '+t.subcategory+'</div>';
        ticketListEl.appendChild(el);

        const row = document.createElement('div');
        row.className = 'ticket';
        row.innerHTML = '<strong>#'+t.id+' — '+t.status+'</strong><div class="muted" style="margin-top:6px">'+t.category+' → '+t.subcategory+'</div>';
        ticketsContainer.appendChild(row);
      });
    }
    document.getElementById('openCount').textContent = tickets.filter(t => t.status === 'Open').length;
  }


// ---------GET ALL TICKETS OF CUSTOMER ---------------------------

async function fetchTickets() {
  try {
    const res = await fetch("http://localhost:8619/api/customer/getTickets", {
      method: "GET",
      credentials: "include"
    });

    if (!res.ok) return;

    const data = await res.json();
    tickets = data;

    renderTickets();

  } catch (err) {
    console.error(err);
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

    if (!res.ok) return;

    const user = await res.json();

    document.getElementById("userName").textContent =
      user.firstName + " " + user.lastName;

    document.getElementById("userEmail").textContent =
      user.emailId;

  } catch (err) {
    console.error("User load failed", err);
  }
}

// ----------------------------------------------------------------------


(function () {
  const nav = document.getElementById('sideNav');
  const views = document.querySelectorAll('.view');
  const pageTitle = document.getElementById('pageTitle');

  const ticketListEl = document.getElementById('ticketList');
  const ticketsContainer = document.getElementById('ticketsContainer');
  let tickets = [];

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
  document.getElementById('refreshBtn').addEventListener('click', () => renderTickets());

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
    debitCardLast4Digits: null
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

  const cardForm = document.getElementById('cardForm');
  cardForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const type = cardTypeEl.value;
    const cardNo = document.getElementById('debitCardNumber').value.trim();
    const comment = document.getElementById('cardComment').value.trim();
    const msg = document.getElementById('cardMsg');

    if (!type || !cardNo || !comment){
      msg.textContent = 'Please select Service, provide Card number, and add Comment.';
      return;
    }

    const cardCount = document.getElementById('cardCount');
    cardCount.textContent = (parseInt(cardCount.textContent || '0', 10) + 1).toString();
    msg.textContent = 'Card request submitted (UI demo).';

    cardForm.reset();
    lostFields.hidden = true;
  });

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

let tickets = [];

loadUser();
fetchTickets();