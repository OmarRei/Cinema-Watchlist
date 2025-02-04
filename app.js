let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    initEventListeners();
});

function initEventListeners() {
    document.getElementById('titleInput').addEventListener('keypress', e => {
        if (e.key === 'Enter') addItem();
    });

    document.getElementById('editRating').addEventListener('click', e => {
        if (e.target.classList.contains('star')) {
            const stars = e.currentTarget.querySelectorAll('.star');
            const value = parseInt(e.target.dataset.value);
            stars.forEach((star, index) => {
                star.textContent = index < value ? '★' : '☆';
            });
        }
    });
}

function loadItems() {
    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    const list = document.getElementById('watchList');
    list.innerHTML = '';
    
    items.forEach(item => renderItem(item));
    filterItems();
}

function renderItem(item) {
    const list = document.getElementById('watchList');
    const li = document.createElement('li');
    li.className = 'list-item';
    li.dataset.id = item.id;
    li.dataset.type = item.type;
    li.dataset.status = item.status;
    li.dataset.rating = item.rating;
    
    li.innerHTML = `
        ${item.image ? 
            `<img src="${item.image}" class="item-image" alt="${item.title}">` : 
            `<div class="item-image placeholder">🎬</div>`}
        <div class="item-content">
            <div class="item-header">
                <h3 class="item-title">${item.title}</h3>
                <span class="status-dot ${item.status}"></span>
            </div>
            <div class="item-meta">
                <span>${item.type}</span>
                <span>• Added: ${new Date(item.added).toLocaleDateString()}</span>
            </div>
            <div class="rating-stars">
                ${Array(5).fill().map((_, i) => 
                    i < item.rating ? '★' : '☆'
                ).join('')}
            </div>
            <div class="item-controls">
                <button onclick="toggleStatus(${item.id})">
                    ${item.status === 'watched' ? '✅ Watched' : '👁️ Mark Watched'}
                </button>
                <button onclick="openEdit(${item.id})">✏️ Edit</button>
                <button onclick="confirmDelete(${item.id})">🗑️ Delete</button>
            </div>
        </div>
    `;
    
    list.appendChild(li);
}

function addItem() {
    const titleInput = document.getElementById('titleInput');
    const imageInput = document.getElementById('imageInput');
    const typeSelect = document.getElementById('typeSelect');

    const newItem = {
        id: Date.now(),
        title: titleInput.value.trim(),
        image: imageInput.value.trim(),
        type: typeSelect.value,
        status: 'unwatched',
        rating: 0,
        added: new Date().toISOString()
    };

    if (!newItem.title) {
        alert('Please enter a title');
        return;
    }

    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    items.push(newItem);
    localStorage.setItem('watchList', JSON.stringify(items));
    
    renderItem(newItem);
    titleInput.value = '';
    imageInput.value = '';
    titleInput.focus();
}

function openEdit(id) {
    currentEditId = id;
    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    const item = items.find(i => i.id === id);

    document.getElementById('editTitle').value = item.title;
    document.getElementById('editImage').value = item.image || '';
    document.getElementById('editType').value = item.type;

    const ratingContainer = document.getElementById('editRating');
    ratingContainer.innerHTML = Array(5).fill()
        .map((_, i) => `<span class="star" data-value="${i+1}">${i < item.rating ? '★' : '☆'}</span>`)
        .join('');

    document.getElementById('editModal').style.display = 'flex';
}

function saveEdit() {
    if (!currentEditId) return;

    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    const itemIndex = items.findIndex(i => i.id === currentEditId);
    
    if (itemIndex === -1) return;

    const newRating = Array.from(document.querySelectorAll('#editRating .star'))
                         .filter(star => star.textContent === '★').length;

    items[itemIndex] = {
        ...items[itemIndex],
        title: document.getElementById('editTitle').value.trim(),
        image: document.getElementById('editImage').value.trim(),
        type: document.getElementById('editType').value,
        rating: newRating
    };

    localStorage.setItem('watchList', JSON.stringify(items));
    closeEdit();
    loadItems();
}

function closeEdit() {
    document.getElementById('editModal').style.display = 'none';
    currentEditId = null;
}

function confirmDelete(id) {
    if (confirm('Are you sure you want to delete this item?')) {
        const items = JSON.parse(localStorage.getItem('watchList') || '[]');
        const filtered = items.filter(i => i.id !== id);
        localStorage.setItem('watchList', JSON.stringify(filtered));
        loadItems();
    }
}

function toggleStatus(id) {
    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    const item = items.find(i => i.id === id);
    item.status = item.status === 'watched' ? 'unwatched' : 'watched';
    localStorage.setItem('watchList', JSON.stringify(items));
    loadItems();
}

function filterItems() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    const statusFilter = document.getElementById('filterStatus').value;

    document.querySelectorAll('.list-item').forEach(item => {
        const matchesSearch = item.textContent.toLowerCase().includes(searchQuery);
        const matchesType = typeFilter === 'all' || item.dataset.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || item.dataset.status === statusFilter;

        item.style.display = (matchesSearch && matchesType && matchesStatus) 
            ? 'flex' 
            : 'none';
    });
}

function exportList() {
    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    if (items.length === 0) {
        alert('Your list is empty!');
        return;
    }
    
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `watchlist-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function importList(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!Array.isArray(importedData) || 
                !importedData.every(item => 
                    item.id && 
                    item.title && 
                    item.type && 
                    item.status
                )) {
                throw new Error('Invalid file format');
            }

            localStorage.setItem('watchList', JSON.stringify(importedData));
            loadItems();
            alert('List imported successfully!');
        } catch (error) {
            alert('Error importing list: Invalid file format');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
function loadItems() {
    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    // Sort items by date added (newest first)
    items.sort((a, b) => new Date(b.added) - new Date(a.added));
    const list = document.getElementById('watchList');
    list.innerHTML = '';
    
    items.forEach(item => renderItem(item));
    filterItems();
}

function addItem() {
    const titleInput = document.getElementById('titleInput');
    const imageInput = document.getElementById('imageInput');
    const typeSelect = document.getElementById('typeSelect');

    const newItem = {
        id: Date.now(),
        title: titleInput.value.trim(),
        image: imageInput.value.trim(),
        type: typeSelect.value,
        status: 'unwatched',
        rating: 0,
        added: new Date().toISOString()  // Ensure added date is stored
    };

    if (!newItem.title) {
        alert('Please enter a title');
        return;
    }

    const items = JSON.parse(localStorage.getItem('watchList') || '[]');
    items.push(newItem);
    localStorage.setItem('watchList', JSON.stringify(items));
    
    loadItems(); // Changed from renderItem() to loadItems()
    titleInput.value = '';
    imageInput.value = '';
    titleInput.focus();
}
