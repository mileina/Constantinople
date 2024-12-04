const API_BASE_URL = 'http://localhost:3000/api/orders';
let orders = [];

const orderReceivedSound = document.getElementById('order-sound'); // Reference the audio element

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginScreen = document.getElementById('login-screen');
  const dashboard = document.getElementById('dashboard');

  if (sessionStorage.getItem('adminLoggedIn')) {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'block';
    fetchOrders();
    setupAutoRefresh();
  }

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const enteredPassword = document.getElementById('password').value;
    if (enteredPassword === 'admin123') { // Replace with your desired password
      sessionStorage.setItem('adminLoggedIn', 'true');
      loginScreen.style.display = 'none';
      dashboard.style.display = 'block';
      fetchOrders();
      setupAutoRefresh();
    } else {
      alert('Mot de passe incorrect');
    }
  });

  document.getElementById('logout').addEventListener('click', () => {
    sessionStorage.removeItem('adminLoggedIn');
    dashboard.style.display = 'none';
    loginScreen.style.display = 'flex';
    document.getElementById('password').value = '';
  });
});

async function fetchOrders() {
  const response = await fetch(API_BASE_URL);
  const newOrders = await response.json();

  if (newOrders.length > orders.length) {
    orderReceivedSound.play(); // Play sound when a new order is received
  }

  orders = newOrders;

  orders.sort((a, b) => a.timestamp - b.timestamp);

  const pendingOrders = orders.filter(order => !order.completed);
  const completedOrders = orders.filter(order => order.completed);
  displayOrders('pending-orders-table', pendingOrders, true);
  displayOrders('completed-orders-table', completedOrders, false);
}

function displayOrders(tableId, orders, isPending) {
  const tableBody = document.getElementById(tableId).querySelector('tbody');
  tableBody.innerHTML = '';
  orders.forEach((order, index) => {
    const productsHtml = order.orderData.items
      .map(product => {
        const options = [
          ...(product.sauces || []).map(s => `Sauce: ${s}`),
          ...(product.retirer || []).map(r => `À retirer: ${r}`),
          ...(product.supplements || []).map(s => `Supplément: ${s}`)
        ]
          .filter(Boolean)
          .join('<br>');

        return `<strong>${product.title}</strong><br>${options}`;
      })
      .join('<hr>');

    const pickupTime = order.clientInfo.pickupTime === 'asap' 
      ? 'Le plus tôt possible' 
      : `À ${order.clientInfo.pickupSlot || 'horaire inconnu'}`;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(order.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
      <td>${order.clientInfo.prenom}</td>
      <td>${order.clientInfo.nom}</td>
      <td>${order.clientInfo.phone}</td>
      <td>${productsHtml}</td>
      <td>${pickupTime}</td>
      <td>${order.orderData.total}</td>
      ${
        isPending
          ? `<td>
              <button class="complete-button" onclick="markAsComplete(${orders.indexOf(order)})">Terminer</button>
              <button class="print-button" onclick="printOrder(${orders.indexOf(order)})">Imprimer</button>
            </td>`
          : ''
      }
    `;
    tableBody.appendChild(row);
  });
}

async function markAsComplete(index) {
  const orderToComplete = orders.find(order => !order.completed && orders.indexOf(order) === index);
  orderToComplete.completed = true;

  await fetch(`${API_BASE_URL}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index }),
  });

  fetchOrders();
}

function printOrder(index) {
  const order = orders[index];
  const printWindow = window.open('', '', 'width=600,height=400');
  const content = `
    <html>
      <head>
        <title>Ticket de Commande</title>
      </head>
      <body>
        <h1>Ticket de Commande</h1>
        <p><strong>Client:</strong> ${order.clientInfo.prenom} ${order.clientInfo.nom}</p>
        <p><strong>Téléphone:</strong> ${order.clientInfo.phone}</p>
        <p><strong>Retrait:</strong> ${
          order.clientInfo.pickupTime === 'asap' 
          ? 'Le plus tôt possible' 
          : `À ${order.clientInfo.pickupSlot || 'horaire inconnu'}`
        }</p>
        <p><strong>Produits:</strong></p>
        <ul>
          ${order.orderData.items.map(product => ` 
            <li>${product.title}</li>
            <ul>
              ${(product.sauces || []).map(s => `<li>Sauce: ${s}</li>`).join('')}
              ${(product.retirer || []).map(r => `<li>À retirer: ${r}</li>`).join('')}
              ${(product.supplements || []).map(s => `<li>Supplément: ${s}</li>`).join('')}
            </ul>
          `).join('')}
        </ul>
        <p><strong>Total:</strong> ${order.orderData.total}</p>
        <p><strong>Heure de réception:</strong> ${new Date(order.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
      </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
}

async function clearAllOrders() {
  if (confirm('Êtes-vous sûr de vouloir supprimer toutes les commandes ?')) {
    try {
      const response = await fetch(API_BASE_URL, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la suppression des commandes');
      }
      alert('Toutes les commandes ont été supprimées avec succès.');
      fetchOrders();
    } catch (error) {
      console.error('Erreur lors de la suppression des commandes:', error);
      alert(`Erreur : ${error.message}`);
    }
  }
}

function setupAutoRefresh() {
  setInterval(fetchOrders, 5000); // Auto refresh every 5 seconds
}

document.getElementById('clear-all-orders').addEventListener('click', clearAllOrders);

document.getElementById('print-all-orders').addEventListener('click', () => {
  const printWindow = window.open('', '', 'width=800,height=600');
  const content = `
    <html>
      <head>
        <title>Liste des Commandes d'Aujourd'hui</title>
      </head>
      <body>
        <h1>Liste des Commandes d'Aujourd'hui</h1>
        <table border="1">
          <thead>
            <tr>
              <th>Heure</th>
              <th>Client</th>
              <th>Téléphone</th>
              <th>Produits</th>
              <th>Retrait</th>
              <th>Total (€)</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(order => `
              <tr>
                <td>${new Date(order.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>${order.clientInfo.prenom} ${order.clientInfo.nom}</td>
                <td>${order.clientInfo.phone}</td>
                <td>${order.orderData.items.map(item => `${item.title}`).join(', ')}</td>
                <td>${order.clientInfo.pickupTime === 'asap' ? 'Le plus tôt possible' : `À ${order.clientInfo.pickupSlot || 'horaire inconnu'}`}</td>
                <td>${order.orderData.total}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.print();
});

fetchOrders();
setupAutoRefresh();
