// ...existing code...
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
  raiseForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const category = categoryEl.value;
    const subcategory = subEl.value;
    const description = document.getElementById('description').value.trim();
    const msg = document.getElementById('raiseMsg');

    if (!category || !subcategory || !description){
      msg.textContent = 'Please select Category, Subcategory, and enter Description.';
      return;
    }
    const id = 'R' + (Math.floor(Math.random() * 9000) + 1000);
    tickets.push({ id, category, subcategory, status: 'Open' });
    msg.textContent = 'Request created (UI demo) — Ref ' + id;

    raiseForm.reset();
    fillSubcategories('');
    setTimeout(() => setView('viewTickets'), 500);
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