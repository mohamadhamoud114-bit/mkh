let inventory = JSON.parse(localStorage.getItem('shop_inventory')) || [];
let salesHistory = JSON.parse(localStorage.getItem('shop_sales_history')) || [];

const todayDateStr = new Date().toISOString().split('T')[0];

document.getElementById('current-date-display').innerText = `تاريخ اليوم: ${todayDateStr}`;
document.getElementById('archive-date-picker').value = todayDateStr;

const productForm = document.getElementById('product-form');
const inventoryList = document.getElementById('inventory-list');
const salesHistoryList = document.getElementById('sales-history-list');
const archiveDatePicker = document.getElementById('archive-date-picker');

function addProduct(e) {
    e.preventDefault();
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const qty = parseInt(document.getElementById('product-qty').value);

    inventory.push({ id: Date.now(), name, price, qty });
    saveData();
    updateUI();
    productForm.reset();
}

function openSellModal(id) {
    const product = inventory.find(p => p.id === id);
    if (!product || product.qty <= 0) {
        alert("الكمية غير متوفرة بالمخزون!");
        return;
    }
    document.getElementById('sell-product-id').value = product.id;
    document.getElementById('modal-product-info').innerText = `المنتج: ${product.name} (المتوفر: ${product.qty} - السعر: ${product.price} $)`;
    document.getElementById('sell-modal').style.display = 'flex';
}

function closeSellModal() {
    document.getElementById('sell-modal').style.display = 'none';
    document.getElementById('sell-form').reset();
}

document.getElementById('sell-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const productId = parseInt(document.getElementById('sell-product-id').value);
    const customerName = document.getElementById('customer-name').value;
    const sellQty = parseInt(document.getElementById('sell-qty').value);
    const discount = parseFloat(document.getElementById('sell-discount').value) || 0;
    const notes = document.getElementById('sell-notes').value;

    const product = inventory.find(p => p.id === productId);

    if (sellQty > product.qty) {
        alert("الكمية المطلوبة أكبر من المتوفر في المخزون!");
        return;
    }

    product.qty -= sellQty;
    const grossTotal = product.price * sellQty;
    const netTotal = grossTotal - discount;

    const saleRecord = {
        id: Date.now(),
        date: todayDateStr,
        time: new Date().toLocaleTimeString('ar-EG'),
        customerName,
        productName: product.name,
        unitPrice: product.price,
        qty: sellQty,
        grossTotal,
        discount,
        netTotal,
        notes
    };

    salesHistory.push(saleRecord);
    saveData();
    updateUI();
    closeSellModal();
});

function deleteProduct(id) {
    inventory = inventory.filter(p => p.id !== id);
    saveData();
    updateUI();
}

function showReceipt(saleId) {
    const sale = salesHistory.find(s => s.id === saleId);
    if (!sale) return;

    document.getElementById('receipt-date').innerText = `${sale.date} - ${sale.time}`;
    document.getElementById('receipt-body-content').innerHTML = `
        <p><b>اسم الزبون:</b> ${sale.customerName}</p>
        <p><b>المنتج:</b> ${sale.productName}</p>
        <p><b>الكمية المباعة:</b> ${sale.qty}</p>
        <p><b>سعر الوحدة:</b> ${sale.unitPrice.toFixed(2)} $</p>
        <p><b>المجموع الإجمالي:</b> ${sale.grossTotal.toFixed(2)} $</p>
        <p><b>الخصم / الحسوم:</b> -${sale.discount.toFixed(2)} $</p>
        <hr>
        <p style="font-size:1.1rem; color:#10b981;"><b>الصافي المطلوب:</b> ${sale.netTotal.toFixed(2)} $</p>
        ${sale.notes ? `<p><b>ملاحظات:</b> ${sale.notes}</p>` : ''}
    `;

    document.getElementById('receipt-modal').style.display = 'flex';
}

function closeReceiptModal() {
    document.getElementById('receipt-modal').style.display = 'none';
}

archiveDatePicker.addEventListener('change', updateUI);

function saveData() {
    localStorage.setItem('shop_inventory', JSON.stringify(inventory));
    localStorage.setItem('shop_sales_history', JSON.stringify(salesHistory));
}

function updateUI() {
    inventoryList.innerHTML = '';
    let totalItems = 0;

    inventory.forEach(p => {
        totalItems += p.qty;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>${p.price.toFixed(2)} $</td>
            <td>${p.qty}</td>
            <td>
                <button class="sell-btn" onclick="openSellModal(${p.id})">بيع</button>
                <button class="delete-btn" onclick="deleteProduct(${p.id})">حذف</button>
            </td>
        `;
        inventoryList.appendChild(tr);
    });

    document.getElementById('total-products').innerText = totalItems;

    // حساب المبيعات اليومية وتحديث الأرشيف
    const selectedDate = archiveDatePicker.value;
    salesHistoryList.innerHTML = '';
    
    let todaySalesSum = 0;

    salesHistory.forEach(s => {
        if (s.date === todayDateStr) {
            todaySalesSum += s.netTotal;
        }

        if (s.date === selectedDate) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.customerName}</td>
                <td>${s.productName} (${s.qty})</td>
                <td><b>${s.netTotal.toFixed(2)} $</b></td>
                <td>
                    <button class="info-btn" onclick="showReceipt(${s.id})"><i class="fas fa-file-alt"></i> الفاتورة</button>
                </td>
            `;
            salesHistoryList.appendChild(tr);
        }
    });

    document.getElementById('today-sales').innerText = `${todaySalesSum.toFixed(2)} $`;
}

productForm.addEventListener('submit', addProduct);
updateUI();
