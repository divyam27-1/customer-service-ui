const users = {
      "U1001": { name: "Abhinav Sharma", email: "abhinav@email.com" },
      "U1002": { name: "Priya Singh", email: "priya@email.com" },
      "U1003": { name: "Rahul Mehra", email: "rahul@email.com" }
    };
    let tickets = [
      {
        id: "T2024",
        user_id: "U1001",
        category: "Internet Banking",
        subcategory: "Password reset",
        description: "Unable to reset password via portal.",
        status: "new",
        date: "2024-06-01",
        comments: [
          { by: "Support", text: "Checked logs, no reset attempt found.", date: "2024-06-02" }
        ]
      },
      {
        id: "T2025",
        user_id: "U1002",
        category: "Account Services",
        subcategory: "Address update",
        description: "Request to update address to 123 New Lane.",
        status: "pending",
        date: "2024-06-02",
        comments: []
      },
      {
        id: "T2026",
        user_id: "U1003",
        category: "Complaints",
        subcategory: "Transaction dispute",
        description: "Dispute for transaction #TXN1234 on 2024-05-30.",
        status: "completed",
        date: "2024-06-03",
        comments: [
          { by: "Support", text: "Dispute resolved, amount refunded.", date: "2024-06-04" }
        ]
      }
    ];
    let selectedTicket = null;

    // Utility for status badge
    function statusClass(status) {
      if (status === "new") return "status status-new";
      if (status === "pending") return "status status-pending";
      if (status === "completed") return "status status-completed";
      return "status";
    }

    // Render ticket list
    function renderTickets(filter = "all") {
      const list = document.getElementById("ticketList");
      list.innerHTML = "";
      let filtered = tickets;
      if (filter !== "all") filtered = tickets.filter(t => t.status === filter);
      if (!filtered.length) {
        list.innerHTML = `<div class="muted" style="margin-top:30px;text-align:center;">No tickets found.</div>`;
        document.getElementById("detailsPanel").hidden = true;
        return;
      }
      filtered.forEach(t => {
        const user = users[t.user_id] || { name: "Unknown", email: "" };
        const div = document.createElement("div");
        div.className = "ticket-item" + (selectedTicket && selectedTicket.id === t.id ? " selected" : "");
        div.innerHTML = `
          <div class="subject">${t.category} &rarr; ${t.subcategory}</div>
          <div class="meta">
            <span>${t.id}</span>
            <span class="${statusClass(t.status)}">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
            <span>${t.date}</span>
          </div>
          <div class="user">${user.name}</div>
        `;
        div.onclick = () => showDetails(t);
        list.appendChild(div);
      });
    }

    // Show ticket details
    function showDetails(ticket) {
      selectedTicket = ticket;
      const user = users[ticket.user_id] || { name: "Unknown", email: "" };
      document.getElementById("detailsPanel").hidden = false;
      document.getElementById("userAvatar").textContent = user.name[0] || "U";
      document.getElementById("userName").textContent = user.name;
      document.getElementById("userEmail").textContent = user.email;
      document.getElementById("ticketId").textContent = ticket.id;
      document.getElementById("ticketCategory").textContent = ticket.category;
      document.getElementById("ticketSubcategory").textContent = ticket.subcategory;
      document.getElementById("ticketStatus").textContent = ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1);
      document.getElementById("ticketDate").textContent = ticket.date;
      document.getElementById("ticketDescription").textContent = ticket.description;
      renderComments(ticket);
      renderTickets(document.querySelector(".ticket-filters button.active").dataset.filter);
    }

    // Render comments
    function renderComments(ticket) {
      const list = document.getElementById("commentList");
      list.innerHTML = "";
      if (!ticket.comments || !ticket.comments.length) {
        list.innerHTML = `<div class="muted">No remarks yet.</div>`;
        return;
      }
      ticket.comments.forEach(c => {
        const div = document.createElement("div");
        div.className = "comment";
        div.innerHTML = `<strong>${c.by}:</strong> ${c.text} <span style="float:right;color:#888;">${c.date}</span>`;
        list.appendChild(div);
      });
    }

    // Filter buttons
    document.querySelectorAll(".ticket-filters button").forEach(btn => {
      btn.onclick = function() {
        document.querySelectorAll(".ticket-filters button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderTickets(btn.dataset.filter);
        document.getElementById("detailsPanel").hidden = true;
        selectedTicket = null;
      };
    });

    // Mark as completed
    document.getElementById("markCompleteBtn").onclick = function() {
      if (!selectedTicket) return;
      selectedTicket.status = "completed";
      showDetails(selectedTicket);
    };
    // Mark as pending
    document.getElementById("markPendingBtn").onclick = function() {
      if (!selectedTicket) return;
      selectedTicket.status = "pending";
      showDetails(selectedTicket);
    };
    // Add comment
    document.getElementById("addCommentBtn").onclick = function() {
      if (!selectedTicket) return;
      const val = document.getElementById("commentInput").value.trim();
      if (!val) return;
      selectedTicket.comments = selectedTicket.comments || [];
      selectedTicket.comments.push({ by: "Support", text: val, date: new Date().toISOString().slice(0,10) });
      document.getElementById("commentInput").value = "";
      showDetails(selectedTicket);
    };

    // Initial render
    renderTickets("all");