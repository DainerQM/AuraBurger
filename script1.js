const products = [
  {
    id: 1,
    name: 'MADURITA',
    desc: 'Carne smash, Queso costeño asado, Maduro caramelizado, Tocineta y Salsa de la casa',
    price: 23000,
    img: 'img/burger_madurita.png'
  },
  {
    id: 2,
    name: 'CLÁSICA SMASH',
    desc: 'Carne smash, Queso americano, Tocineta y Salsa de la casa',
    price: 20000,
    img: 'img/burger_clasic.png'
  },
  {
    id: 3,
    name: 'IBÉRICA',
    desc: 'Carne smash, queso americano, cebolla caramelizada, creama de champiñones, jamón cserrano, salami y salsa BBq bourbon',
    price: 25000,
    img: 'img/burger_iberica.png'
  },
  {
    id: 4,
    name: 'ARGENTINA',
    desc: 'Carne smash, queso amaricano, chorizo argentino, pimentones caramelizados, salsa ranchera',
    price: 25000,
    img: 'img/burger_argentina.png'
  },
  {
    id: 5,
    name: 'DOBLE SMASH',
    desc: 'Doble carne smash, Queso americano, Tocineta y Salsa de la casa',
    price: 30000,
    img: 'img/burger_doble.png'
  },
];

const extras = [
  ['Queso americano', 2000],
  ['Tocineta', 2000],
  ['Papas', 3000],
];

let cart = [];
let selected = null;
let drink = 0;

const $ = s => document.querySelector(s);
const money = n => `$${n.toLocaleString('es-MX')}`;

function renderProducts() {
  $('#productGrid').innerHTML = products
    .map(
      p => `
        <article class="product-card">
          <div class="product-image">
            <img src="${p.img}" alt="${p.name}" />
          </div>
          <h4>${p.name}</h4>
          <p>${p.desc}</p>

          <div class="card-bottom">
            <span class="price">${money(p.price)}</span>
            <button
              class="add-btn"
              data-product="${p.id}"
              aria-label="Personalizar ${p.name}"
            >
              +
            </button>
          </div>
        </article>
      `
    )
    .join('');

  document.querySelectorAll('[data-product]').forEach(
    b => (b.onclick = () => openCustomize(+b.dataset.product))
  );
}

function openCustomize(id) {
  selected = products.find(p => p.id === id);

  $('#customizeContent').innerHTML = `
    <span class="eyebrow">PERSONALIZA TU BURGER</span>
    <h2 class="custom-title">${selected.name}</h2>
    <p class="custom-desc">${selected.desc}</p>

    <div class="option-list">
      ${extras
        .map(
          (e, i) => `
            <div class="option">
              <label>
                <input type="checkbox" value="${i}">
                ${e[0]}
              </label>
              <small>+${money(e[1])}</small>
            </div>
          `
        )
        .join('')}
    </div>

    <button class="btn btn-primary full" id="addToCart">
      Agregar al pedido · ${money(selected.price)}
    </button>
  `;

  $('#customizeModal').classList.add('active');

  $('#addToCart').onclick = () => {
    const chosen = [
      ...document.querySelectorAll('.option input:checked')
    ].map(x => +x.value);

    cart.push({
      id: Date.now(),
      product: selected,
      extras: chosen,
      qty: 1
    });

    close('customizeModal');
    renderCart();
    toast('¡Agregado a tu pedido!');
  };
}

function renderCart() {
  const count = cart.reduce((a, x) => a + x.qty, 0);

  const subtotal = cart.reduce(
    (a, x) =>
      a +
      (x.product.price +
        x.extras.reduce((s, i) => s + extras[i][1], 0)) *
        x.qty,
    0
  );

  $('#cartCount').textContent = count;
  $('#cartTotal').textContent = money(subtotal + drink);

  if (!cart.length) {
    $('#cartItems').innerHTML =
      '<div class="empty">Tu carrito está esperando algo delicioso.</div>';
    return;
  }

  $('#cartItems').innerHTML = cart
    .map(x => {
      const unit =
        x.product.price +
        x.extras.reduce((s, i) => s + extras[i][1], 0);

      return `
        <div class="cart-item">
          <div class="mini-img">
            <img src="${x.product.img}" alt="${x.product.name}" />
          </div>

          <div>
            <h4>${x.product.name}</h4>
            <p>
              ${
                x.extras.length
                  ? x.extras.map(i => extras[i][0]).join(', ')
                  : 'Sin adicionales'
              }
            </p>

            <div class="qty">
              <button data-qty="-1" data-id="${x.id}">−</button>
              <b>${x.qty}</b>
              <button data-qty="1" data-id="${x.id}">+</button>
            </div>
          </div>

          <div>
            <strong>${money(unit * x.qty)}</strong>
            <br />
            <button class="remove" data-remove="${x.id}">
              Eliminar
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  document.querySelectorAll('[data-qty]').forEach(
    b =>
      (b.onclick = () =>
        changeQty(+b.dataset.id, +b.dataset.qty))
  );

  document.querySelectorAll('[data-remove]').forEach(
    b =>
      (b.onclick = () => {
        cart = cart.filter(x => x.id !== +b.dataset.remove);
        renderCart();
      })
  );
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);

  item.qty += delta;

  if (item.qty < 1) {
    cart = cart.filter(x => x.id !== id);
  }

  renderCart();
}

function openCheckout() {
  if (!cart.length) {
    toast('Agrega una hamburguesa primero');
    return;
  }

  $('#cartDrawer').classList.remove('open');

  drink = 0;

  showSummary();
  $('#checkoutModal').classList.add('active');
}

function removeExtraFromItem(itemId, extraIndex) {
  const item = cart.find(x => x.id === itemId);
  if (!item) return;

  item.extras = item.extras.filter(i => i !== extraIndex);
  renderCart();
  showSummary();
}

function showSummary() {
  $('#stepNumber').textContent = '1';

  const summaryList = cart
    .map(x => {
      const unit =
        x.product.price +
        x.extras.reduce((s, i) => s + extras[i][1], 0);

      return `
        <div class="summary-item">
          <div class="summary-main">
            <div class="summary-image">
              <img src="${x.product.img}" alt="${x.product.name}" />
            </div>
            <div>
              <h3>${x.product.name}</h3>
              <p>${x.qty} unidad${x.qty > 1 ? 'es' : ''}</p>
            </div>
          </div>

          <div class="summary-meta">
            <strong>${money(unit * x.qty)}</strong>
            <div class="summary-extras">
              ${
                x.extras.length
                  ? x.extras
                      .map(
                        i => `
                          <span class="summary-extra">
                            ${extras[i][0]}
                            <button type="button" data-remove-extra="${x.id}" data-extra-index="${i}">Quitar</button>
                          </span>
                        `
                      )
                      .join('')
                  : '<span class="summary-extra empty-extra">Sin adicionales</span>'
              }
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const total =
    cart.reduce(
      (a, x) =>
        a +
        (x.product.price +
          x.extras.reduce((s, i) => s + extras[i][1], 0)) *
          x.qty,
      0
    ) + drink;

  $('#checkoutContent').innerHTML = `
    <span class="eyebrow">CONFIRMACIÓN</span>
    <h2>Revisa tu pedido</h2>
    <p>Comprueba todo antes de completar tus datos.</p>

    <div class="summary-list">
      ${summaryList}
    </div>

    <div class="drink-options">
      ${[
        ['Coca-Cola', 3000],
        ['Sin bebida', 0]
      ]
        .map(
          d => `
            <div class="drink-option">
              <label>
                <input
                  type="radio"
                  name="drink"
                  value="${d[1]}"
                  ${drink === d[1] ? 'checked' : ''}
                >
                ${d[0]}
              </label>
              <b>${d[1] ? money(d[1]) : 'Gratis'}</b>
            </div>
          `
        )
        .join('')}
    </div>

    <div class="summary-total">
      <span>Total</span>
      <strong>${money(total)}</strong>
    </div>

    <button class="btn btn-primary full" id="summaryNext">
      Continuar <span>→</span>
    </button>
  `;

  document.querySelectorAll('[data-remove-extra]').forEach(btn => {
    btn.onclick = () => {
      removeExtraFromItem(+btn.dataset.removeExtra, +btn.dataset.extraIndex);
    };
  });

  document.querySelectorAll('input[name="drink"]').forEach(input => {
    input.onchange = () => {
      drink = +input.value;
      showSummary();
    };
  });

  $('#summaryNext').onclick = () => renderForm();
}

function renderForm() {
  $('#stepNumber').textContent = '2';

  $('#checkoutContent').innerHTML = `
    <span class="eyebrow">ENTREGA</span>
    <h2>¿Dónde lo llevamos?</h2>
    <p>Completa tus datos para finalizar.</p>

    <form id="orderForm">
      <div class="form-grid">
        <div class="field">
          <label>Nombre y apellido *</label>
          <input
            name="name"
            required
            placeholder="Aura Pérez"
          />
          <span class="error"></span>
        </div>

        <div class="field">
          <label>Celular *</label>
          <input
            name="phone"
            required
            inputmode="numeric"
            placeholder="11 5555 5555"
          />
          <span class="error"></span>
        </div>
      </div>

      <div class="field">
        <label>Dirección *</label>
        <input
          name="address"
          required
          placeholder="Calle, número y localidad"
        />
        <span class="error"></span>
      </div>

      <div class="field">
        <label>Método de pago *</label>
        <select name="payment" required>
          <option value="">Selecciona una opción</option>
          <option>Efectivo</option>
          <option>Transferencia</option>
        </select>
        <span class="error"></span>
      </div>

      <button class="btn btn-primary full" type="submit">
        Finalizar pedido · ${money(
          cart.reduce(
            (a, x) =>
              a +
              (x.product.price +
                x.extras.reduce((s, i) => s + extras[i][1], 0)) *
                x.qty,
            0
          ) + drink
        )}
      </button>
    </form>
  `;

  $('#orderForm').onsubmit = e => {
    e.preventDefault();

    let valid = true;

    document.querySelectorAll('#orderForm [required]').forEach(input => {
      const error = input.parentElement.querySelector('.error');

      error.textContent = '';

      if (!input.value.trim()) {
        error.textContent = 'Este campo es obligatorio';
        valid = false;
      }

      if (
        input.name === 'phone' &&
        input.value &&
        !/^[0-9\s()+-]{8,}$/.test(input.value)
      ) {
        error.textContent = 'Ingresa un celular válido';
        valid = false;
      }
    });

    if (valid) {
      showSuccess();
    }
  };
}

function showSuccess() {
  $('#stepNumber').textContent = '✓';

  $('#checkoutContent').innerHTML = `
    <div class="success">
      <div class="success-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 12.5 9.2 16.7 19 6.9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h2>¡Pedido realizado con éxito!</h2>
      <p>
        Tu comida ya se está preparando. Espérala en la comodidad
        de tu casa.
      </p>

      <button
        class="btn btn-primary full"
        id="newOrder"
        style="margin-top:24px"
      >
        Hacer otro pedido
      </button>
    </div>
  `;

  cart = [];
  drink = 0;

  renderCart();

  $('#newOrder').onclick = () => close('checkoutModal');
}

function close(id) {
  $('#' + id).classList.remove('active');
}

function toast(msg) {
  const t = $('#toast');

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 2200);
}

document.addEventListener('click', e => {
  const closeBtn = e.target.closest('[data-close]');

  if (closeBtn) {
    close(closeBtn.dataset.close);
  }
});

$('[data-close-welcome]').onclick = () => close('welcomeModal');

$('#cartButton').onclick = () =>
  $('#cartDrawer').classList.add('open');

$('#checkoutButton').onclick = openCheckout;

renderProducts();
renderCart();
