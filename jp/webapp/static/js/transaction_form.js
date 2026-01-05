(function () {
  'use strict';

  const pricing = window.PRODUCT_PRICING || {};
  const existingItems = window.EXISTING_ITEMS || [];

  const template = document.getElementById('item-row-template');
  const itemsBody = document.getElementById('items-body');
  const addButton = document.getElementById('add-item');
  const totalDisplay = document.getElementById('items-total');

  if (!template || !itemsBody || !addButton || !totalDisplay) {
    return;
  }

  const todayString = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  };

  const formatNumber = (value) => (Number.isFinite(value) ? value.toLocaleString() : '0');
  const parseDisplayNumber = (value) => {
    if (typeof value !== 'string') {
      return Number.isFinite(value) ? value : 0;
    }
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const recalcRow = (row) => {
    const product = row.querySelector('[name="item_product[]"]').value;
    const priceType = row.querySelector('[name="item_price_type[]"]').value;
    const width = Number(row.querySelector('[name="item_width[]"]').value);
    const height = Number(row.querySelector('[name="item_height[]"]').value);
    const quantity = Number(row.querySelector('[name="item_quantity[]"]').value);

    const unitSpan = row.querySelector('.unit-price');
    const supplySpan = row.querySelector('.supply-price');

    if (!product || !priceType || !Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(quantity)) {
      unitSpan.textContent = '0';
      supplySpan.textContent = '0';
      return;
    }

    const productPrices = pricing[product];
    if (!productPrices || typeof productPrices[priceType] === 'undefined') {
      unitSpan.textContent = '0';
      supplySpan.textContent = '0';
      return;
    }

    const unitPrice = Math.floor((productPrices[priceType] * width * height) / 90000);
    const supplyPrice = unitPrice * quantity;

    unitSpan.textContent = formatNumber(unitPrice);
    supplySpan.textContent = formatNumber(supplyPrice);
  };

  const updateTotal = () => {
    const supplySpans = itemsBody.querySelectorAll('.supply-price');
    let total = 0;
    supplySpans.forEach((span) => {
      total += parseDisplayNumber(span.textContent);
    });
    totalDisplay.textContent = formatNumber(total);
  };

  const attachRowEvents = (row) => {
    row.querySelectorAll('input, select').forEach((element) => {
      element.addEventListener('input', () => {
        recalcRow(row);
        updateTotal();
      });
      element.addEventListener('change', () => {
        recalcRow(row);
        updateTotal();
      });
    });

    const removeButton = row.querySelector('.remove-item');
    removeButton.addEventListener('click', () => {
      row.remove();
      updateTotal();
    });
  };

  const addRow = (itemData) => {
    const clone = document.importNode(template.content, true);
    const row = clone.querySelector('tr');

    const dateInput = row.querySelector('[name="item_date[]"]');
    const productSelect = row.querySelector('[name="item_product[]"]');
    const priceSelect = row.querySelector('[name="item_price_type[]"]');
    const widthInput = row.querySelector('[name="item_width[]"]');
    const heightInput = row.querySelector('[name="item_height[]"]');
    const quantityInput = row.querySelector('[name="item_quantity[]"]');

    const data = itemData || {};
    dateInput.value = data.date || todayString();
    productSelect.value = data.product || '';
    priceSelect.value = data.price_type || '';
    widthInput.value = data.width || '';
    heightInput.value = data.height || '';
    quantityInput.value = data.quantity || '';

    attachRowEvents(row);
    itemsBody.appendChild(row);
    recalcRow(row);
    updateTotal();
  };

  addButton.addEventListener('click', () => addRow());

  if (existingItems.length) {
    existingItems.forEach((item) => addRow(item));
  } else {
    addRow();
  }
})();
