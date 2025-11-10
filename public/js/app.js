let deleteId = null;
let editingId = null;

// Load APIs on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAPIs();
    checkSuccessMessage();
    // Refresh every 30 seconds
    setInterval(loadAPIs, 30000);
});

// Check for success message in URL
function checkSuccessMessage() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    if (success) {
        const messages = {
            'created': 'WhatsApp API created successfully!',
            'updated': 'WhatsApp API updated successfully!',
            'deleted': 'WhatsApp API deleted successfully!'
        };
        showSuccessMessage(messages[success] || 'Operation completed successfully!');
        // Clean URL
        window.history.replaceState({}, document.title, '/');
    }
}

function showSuccessMessage(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 5000);
}

// Load all APIs
async function loadAPIs() {
    try {
        const response = await fetch('/apis/data');
        const apis = await response.json();
        displayAPIs(apis);
    } catch (error) {
        console.error('Error loading APIs:', error);
        document.getElementById('loadingMessage').textContent = 'Error loading APIs';
    }
}

// Display APIs in table
function displayAPIs(apis) {
    const table = document.getElementById('apisTable');
    const tableBody = document.getElementById('apisTableBody');
    const loadingMessage = document.getElementById('loadingMessage');
    const emptyMessage = document.getElementById('emptyMessage');

    loadingMessage.classList.add('hidden');

    if (apis.length === 0) {
        table.classList.add('hidden');
        emptyMessage.classList.remove('hidden');
        return;
    }

    emptyMessage.classList.add('hidden');
    table.classList.remove('hidden');
    tableBody.innerHTML = '';

    apis.forEach(api => {
        const row = document.createElement('tr');
        const statusBadge = getStatusBadge(api.status);
        const connectionStatusBadge = getConnectionStatusBadge(api.connection_status);
        const lastChecked = api.last_checked 
            ? new Date(api.last_checked).toLocaleString() 
            : 'Never';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(api.name)}</div>
                ${api.description ? `<div class="text-sm text-gray-500">${escapeHtml(api.description)}</div>` : ''}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHtml(api.endpoint)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${connectionStatusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${lastChecked}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="checkConnection(${api.id})" 
                    class="text-indigo-600 hover:text-indigo-900 mr-3">Check</button>
                <button onclick="editAPI(${api.id})" 
                    class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="deleteAPI(${api.id})" 
                    class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'online': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Online</span>',
        'offline': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Offline</span>',
        'unknown': '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Unknown</span>'
    };
    return badges[status] || badges['unknown'];
}

// Get connection status badge HTML
function getConnectionStatusBadge(connectionStatus) {
    if (!connectionStatus) {
        return '<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">-</span>';
    }
    
    // Format the connection status (replace underscores with spaces and capitalize)
    const formatted = connectionStatus
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    
    // Color coding based on connection status
    const statusColors = {
        'qr_ready': 'bg-blue-100 text-blue-800',
        'connected': 'bg-green-100 text-green-800',
        'disconnected': 'bg-red-100 text-red-800',
        'connecting': 'bg-yellow-100 text-yellow-800',
        'authenticated': 'bg-green-100 text-green-800'
    };
    
    const colorClass = statusColors[connectionStatus] || 'bg-gray-100 text-gray-800';
    
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}">${escapeHtml(formatted)}</span>`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open form modal for adding
function openFormModal() {
    editingId = null;
    document.getElementById('formTitle').textContent = 'Add WhatsApp API';
    document.getElementById('apiForm').reset();
    document.getElementById('apiId').value = '';
    document.getElementById('formModal').classList.remove('hidden');
}

// Edit API
async function editAPI(id) {
    try {
        const response = await fetch('/apis/data');
        const apis = await response.json();
        const api = apis.find(a => a.id === id);
        
        if (!api) {
            alert('API not found');
            return;
        }

        editingId = id;
        document.getElementById('formTitle').textContent = 'Edit WhatsApp API';
        document.getElementById('apiId').value = api.id;
        document.getElementById('name').value = api.name;
        document.getElementById('endpoint').value = api.endpoint;
        document.getElementById('token').value = api.token;
        document.getElementById('description').value = api.description || '';
        document.getElementById('formModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading API:', error);
        alert('Error loading API details');
    }
}

// Close form modal
function closeFormModal() {
    document.getElementById('formModal').classList.add('hidden');
    editingId = null;
}

// Handle form submission
document.getElementById('apiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    const url = editingId ? `/apis/${editingId}` : '/apis';
    const method = 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });

        if (response.ok) {
            window.location.href = response.url || '/';
        } else {
            const error = await response.json();
            alert(error.error || 'Error saving API');
        }
    } catch (error) {
        console.error('Error saving API:', error);
        alert('Error saving API');
    }
});

// Delete API
function deleteAPI(id) {
    deleteId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    deleteId = null;
}

// Confirm delete
async function confirmDelete() {
    if (!deleteId) return;

    try {
        const response = await fetch(`/apis/${deleteId}/delete`, {
            method: 'POST'
        });

        if (response.ok) {
            window.location.href = '/?success=deleted';
        } else {
            alert('Error deleting API');
        }
    } catch (error) {
        console.error('Error deleting API:', error);
        alert('Error deleting API');
    }
}

// Check connection
async function checkConnection(id) {
    try {
        const response = await fetch(`/apis/${id}/check`, {
            method: 'POST'
        });

        if (response.ok) {
            showSuccessMessage('Connection check completed');
            loadAPIs();
        } else {
            const error = await response.json();
            alert(error.error || 'Error checking connection');
        }
    } catch (error) {
        console.error('Error checking connection:', error);
        alert('Error checking connection');
    }
}

