fetch('menu.json')
  .then(response => response.json())
  .then(data => {
    const menuContainer = document.getElementById('menu');
    const sidebarItems = document.querySelectorAll('.sidebar ul li');

    displayMenu(data["Grillades"]);

    sidebarItems.forEach((item) => {
      item.addEventListener('click', () => {
        const categoryName = item.textContent.trim();
        menuContainer.innerHTML = '';

        if (data[categoryName]?.menu) {
          displayMenu(data[categoryName].menu, data[categoryName]?.supplements);
        } else if (data[categoryName]) {
          displayMenu(data[categoryName]);
        } else {
          console.error(`Données manquantes pour la catégorie: ${categoryName}`);
        }

        sidebarItems.forEach(el => el.classList.remove('active'));
        item.classList.add('active');
      });
    });
  })
  .catch(error => console.error('Erreur de chargement des données JSON:', error));

function displayMenu(items, supplements = null) {
  const menuContainer = document.getElementById('menu');

  items.forEach(item => {
    const product = document.createElement('div');
    product.classList.add('product');
    product.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p>${item.desc}</p>
      <span class="price">${item.price}</span>
    `;
    product.addEventListener('click', () => {
      openProductModal(item, supplements);
    });
    menuContainer.appendChild(product);
  });
}

function openProductModal(item, supplements = null) {
  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-desc').textContent = item.desc;
  document.getElementById('modal-price').textContent = item.price;

  const modalOptions = document.getElementById('modal-options');
  modalOptions.innerHTML = '';

  if (supplements) {
    const ul = document.createElement('ul');
    for (const [name, price] of Object.entries(supplements)) {
      const li = document.createElement('li');
      li.innerHTML = `<input type="checkbox" data-price="${price.replace(',', '.').replace('€', '')}" value="${name}"> ${name} (+${price})`;
      ul.appendChild(li);
    }
    modalOptions.innerHTML = `<h4>Suppléments au choix</h4>`;
    modalOptions.appendChild(ul);
  }

  const addToCartButton = document.querySelector('.add-to-cart');
  addToCartButton.dataset.title = item.name;
  addToCartButton.dataset.price = item.price.replace(',', '.').replace('€', '');

  const modal = document.getElementById('modal');
  modal.style.display = 'block';
}

let cart = [];
const cartCountElement = document.getElementById('cart-count');
const cartItemsElement = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');

const addToCartButton = document.querySelector('.add-to-cart');
addToCartButton.addEventListener('click', () => {
  const title = addToCartButton.dataset.title;
  let price = parseFloat(addToCartButton.dataset.price);

  const selectedSupplements = [];
  const options = document.querySelectorAll('.modal-options input[type="checkbox"]:checked');
  options.forEach(option => {
    selectedSupplements.push(option.value);
    price += parseFloat(option.dataset.price);
  });

  cart.push({ title, price, supplements: selectedSupplements });

  cartCountElement.textContent = cart.length;
  document.getElementById('modal').style.display = 'none';

  console.log('Panier:', cart);
});

function updateCartModal() {
  cartItemsElement.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const supplementsText = item.supplements.length > 0 ? ` (${item.supplements.join(', ')})` : '';
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.title} - ${item.price.toFixed(2).replace('.', ',')} €${supplementsText}</span>
      <button class="remove-item" data-index="${index}">Supprimer</button>
    `;

    total += item.price;

    cartItemsElement.appendChild(li);
  });

  cartTotalElement.textContent = `${total.toFixed(2).replace('.', ',')} €`;

  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (event) => {
      const index = event.target.dataset.index;
      cart.splice(index, 1);
      updateCartModal();
      cartCountElement.textContent = cart.length;
    });
  });
}

const cartButton = document.querySelector('.cart');
cartButton.addEventListener('click', () => {
  updateCartModal();
  document.getElementById('cart-modal').style.display = 'block';
});

const cartClose = document.getElementById('cart-close');
cartClose.addEventListener('click', () => {
  document.getElementById('cart-modal').style.display = 'none';
});

const confirmOrderButton = document.getElementById('confirm-order');
confirmOrderButton.addEventListener('click', () => {
  const orderData = {
    items: cart,
    total: cartTotalElement.textContent
  };
  localStorage.setItem('orderData', JSON.stringify(orderData));
  window.location.href = 'confirmation.html';
});

window.addEventListener('click', (event) => {
  const modal = document.getElementById('modal');
  const cartModal = document.getElementById('cart-modal');

  if (event.target === modal) {
    modal.style.display = 'none';
  }
  if (event.target === cartModal) {
    cartModal.style.display = 'none';
  }
});

const modalClose = document.getElementById('modal-close');
const modal = document.getElementById('modal');

modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

function showNotification(message) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('hidden');

  setTimeout(() => {
    notification.classList.add('hidden');
  }, 3000);
}

addToCartButton.addEventListener('click', () => {
  const title = addToCartButton.dataset.title;
  let price = parseFloat(addToCartButton.dataset.price);

  const selectedSupplements = [];
  const options = document.querySelectorAll('.modal-options input[type="checkbox"]:checked');
  options.forEach(option => {
    selectedSupplements.push(option.value);
    price += parseFloat(option.dataset.price);
  });

  cart.push({ title, price, supplements: selectedSupplements });

  cartCountElement.textContent = cart.length;
  document.getElementById('modal').style.display = 'none';

  showNotification(`"${title}" a été ajouté au panier !`);

  console.log('Panier:', cart);
});
