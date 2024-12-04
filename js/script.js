document.addEventListener('DOMContentLoaded', () => {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartCountElement = document.getElementById('cart-count');
  const cartItemsElement = document.getElementById('cart-items');
  const cartTotalElement = document.getElementById('cart-total');
  const menuContainer = document.getElementById('menu');
  const sidebarItems = document.querySelectorAll('.sidebar ul li');
  const addToCartButton = document.querySelector('.add-to-cart');
  let menuData = null;

  fetch('menu.json')
    .then(response => response.json())
    .then(data => {
      menuData = data;
      loadCategory('Grillades');

      sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
          const categoryName = item.textContent.trim();
          loadCategory(categoryName);

          sidebarItems.forEach(el => el.classList.remove('active'));
          item.classList.add('active');
        });
      });
    })
    .catch(error => console.error('Erreur de chargement des données JSON:', error));

  function loadCategory(categoryName) {
    menuContainer.innerHTML = '';
    if (menuData[categoryName]?.menu) {
      const category = menuData[categoryName];
      displayMenu(category.menu, categoryName, category.supplements, category.sauces, category.retirer);
    } else {
      console.error(`La catégorie "${categoryName}" est introuvable dans les données.`);
    }
  }

  function displayMenu(items, category, supplements = null, sauces = null, retirer = null) {
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
        openProductModal(item, category, supplements, sauces, retirer);
      });
      menuContainer.appendChild(product);
    });
  }

  function openProductModal(item, category, supplements = null, sauces = null, retirer = null) {
    document.getElementById('modal-title').textContent = `${category} - ${item.name}`;
    document.getElementById('modal-desc').textContent = item.desc;
    document.getElementById('modal-price').textContent = item.price;

    const modalOptions = document.getElementById('modal-options');
    modalOptions.innerHTML = '';

    if (supplements) {
      const ul = document.createElement('ul');
      for (const [name, price] of Object.entries(supplements)) {
        const li = document.createElement('li');
        li.innerHTML = `<input type="checkbox" data-price="${price.replace(',', '.').replace('€', '')}" value="${name}"> <span class="supplement-name">${name}</span> (+${price})`;
        ul.appendChild(li);
      }
      modalOptions.innerHTML = `<h4>Suppléments au choix</h4>`;
      modalOptions.appendChild(ul);
    }

    if (sauces) {
      const sauceSection = document.createElement('div');
      sauceSection.innerHTML = `<h4>Choisissez jusqu'à ${sauces.max_selection} sauces :</h4>`;
      const sauceContainer = document.createElement('div');
      sauces.options.forEach(sauce => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" class="sauce-option" value="${sauce}"> ${sauce}`;
        sauceContainer.appendChild(label);
      });
      sauceSection.appendChild(sauceContainer);
      modalOptions.appendChild(sauceSection);
    
      const sauceCheckboxes = sauceContainer.querySelectorAll('.sauce-option');
      sauceCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          const selected = Array.from(sauceCheckboxes).filter(cb => cb.checked);
          if (selected.length >= sauces.max_selection) {
            sauceCheckboxes.forEach(cb => {
              if (!cb.checked) {
                cb.disabled = true;
              }
            });
          } else {
            sauceCheckboxes.forEach(cb => cb.disabled = false);
          }
        });
      });
    }
    

    if (retirer) {
      const retirerSection = document.createElement('div');
      retirerSection.innerHTML = `<h4>À retirer :</h4>`;
      const retirerContainer = document.createElement('div');
      retirer.options.forEach(ingredient => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" class="remove-option" value="${ingredient}"> ${ingredient}`;
        retirerContainer.appendChild(label);
      });
      retirerSection.appendChild(retirerContainer);
      modalOptions.appendChild(retirerSection);
    }

    addToCartButton.dataset.title = item.name;
    addToCartButton.dataset.category = category;
    addToCartButton.dataset.price = item.price.replace(',', '.').replace('€', '');
    document.getElementById('modal').style.display = 'block';
  }

  addToCartButton.addEventListener('click', () => {
    const title = addToCartButton.dataset.title;
    const category = addToCartButton.dataset.category;
    let price = parseFloat(addToCartButton.dataset.price);
  
    const selectedSupplements = Array.from(document.querySelectorAll('.modal-options input[type="checkbox"]:checked'))
      .filter(option => option.closest('ul')) 
      .map(option => {
        price += parseFloat(option.dataset.price || 0);
        return option.value;
      });
  
    const sauces = Array.from(document.querySelectorAll('.sauce-option:checked')).map(option => option.value);
  
    const retirer = Array.from(document.querySelectorAll('.remove-option:checked')).map(option => option.value);
  
    cart.push({ category, title, price, supplements: selectedSupplements, sauces, retirer });
    saveCart();
    cartCountElement.textContent = cart.length;
    document.getElementById('modal').style.display = 'none';
    showNotification(`"${title}" a été ajouté au panier !`);
  });
  

  function updateCartModal() {
    cartItemsElement.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
      const supplementsText = item.supplements.length > 0 ? `Suppléments: ${item.supplements.join(', ')}` : '';
      const saucesText = item.sauces.length > 0 ? `Sauces: ${item.sauces.join(', ')}` : '';
      const retirerText = item.retirer.length > 0 ? `À retirer: ${item.retirer.join(', ')}` : '';

      const li = document.createElement('li');
      li.innerHTML = `
        <span>${item.category} - ${item.title}</span>
        <p>${saucesText}</p>
        <p>${retirerText}</p>
        <p>${supplementsText}</p>
        <p>Prix: ${item.price.toFixed(2).replace('.', ',')} €</p>
        <button class="remove-item" data-index="${index}">Supprimer</button>
      `;

      total += item.price;
      cartItemsElement.appendChild(li);
    });

    cartTotalElement.textContent = `${total.toFixed(2).replace('.', ',')} €`;

    document.querySelectorAll('.remove-item').forEach(button => {
      button.addEventListener('click', event => {
        const index = event.target.dataset.index;
        cart.splice(index, 1);
        saveCart();
        updateCartModal();
        cartCountElement.textContent = cart.length;
      });
    });
  }

  function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);
    localStorage.setItem('cart-expiry', expiryDate.toISOString());
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

  window.addEventListener('click', event => {
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
  modalClose.addEventListener('click', () => {
    document.getElementById('modal').style.display = 'none';
  });

  function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    setTimeout(() => {
      notification.classList.add('hidden');
    }, 3000);
  }

  cartCountElement.textContent = cart.length;

  const cartExpiry = new Date(localStorage.getItem('cart-expiry'));
  const currentTime = new Date();
  if (currentTime > cartExpiry) {
    localStorage.removeItem('cart');
    localStorage.removeItem('cart-expiry');
    cart = [];
    cartCountElement.textContent = cart.length;
  }
});
