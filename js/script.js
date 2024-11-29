document.addEventListener('DOMContentLoaded', () => {
  fetch('menu.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur de chargement du fichier JSON');
      }
      return response.json();
    })
    .then(data => {
      const menuContainer = document.getElementById('menu');
      const sidebarItems = document.querySelectorAll('.sidebar ul li');

      // Affichage par défaut
      if (data["Grillades"]) {
        displayMenu(data["Grillades"]);
      }

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
      console.log(`Affichage de l'article: ${item.name}, Image URL: ${item.image}`);
      const product = document.createElement('div');
      product.classList.add('product');
      product.innerHTML = `
        <img src="https://constantinople.netlify.app/${item.image}?v=1" alt="${item.name}" onerror="this.src='https://via.placeholder.com/150';">
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
});
