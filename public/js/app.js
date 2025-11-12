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

// Display APIs in table and cards
function displayAPIs(apis) {
    const table = document.getElementById('apisTable');
    const tableBody = document.getElementById('apisTableBody');
    const cardsContainer = document.getElementById('apisCards');
    const loadingMessage = document.getElementById('loadingMessage');
    const emptyMessage = document.getElementById('emptyMessage');

    loadingMessage.classList.add('hidden');

    if (apis.length === 0) {
        table.classList.add('hidden');
        if (cardsContainer) cardsContainer.innerHTML = '';
        emptyMessage.classList.remove('hidden');
        return;
    }

    emptyMessage.classList.add('hidden');
    table.classList.remove('hidden');
    tableBody.innerHTML = '';
    if (cardsContainer) cardsContainer.innerHTML = '';

    apis.forEach(api => {
        const statusBadge = getStatusBadge(api.status);
        const connectionStatusBadge = getConnectionStatusBadge(api.connection_status);
        const lastChecked = api.last_checked 
            ? new Date(api.last_checked).toLocaleString() 
            : 'Never';

        // Desktop table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${escapeHtml(api.name)}</div>
                ${api.description ? `<div class="text-sm text-gray-500">${escapeHtml(api.description)}</div>` : ''}
            </td>
            <td class="px-4 lg:px-6 py-4">
                <div class="text-sm text-gray-900 break-words max-w-xs">${escapeHtml(api.endpoint)}</div>
            </td>
            <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            <td class="px-4 lg:px-6 py-4 whitespace-nowrap">
                ${connectionStatusBadge}
            </td>
            <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${lastChecked}
            </td>
            <td class="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="checkConnection(${api.id})" 
                    class="text-indigo-600 hover:text-indigo-900 mr-3">Check</button>
                <button onclick="viewLogs(${api.id}, '${escapeHtml(api.name)}')" 
                    class="text-blue-600 hover:text-blue-900 mr-3">Logs</button>
                <button onclick="editAPI(${api.id})" 
                    class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="deleteAPI(${api.id})" 
                    class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);

        // Mobile card
        if (cardsContainer) {
            const card = document.createElement('div');
            card.className = 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-gray-900 mb-1">${escapeHtml(api.name)}</h3>
                        ${api.description ? `<p class="text-sm text-gray-600 mb-2">${escapeHtml(api.description)}</p>` : ''}
                    </div>
                </div>
                <div class="space-y-2 mb-4">
                    <div>
                        <span class="text-xs font-medium text-gray-500 uppercase">Endpoint</span>
                        <p class="text-sm text-gray-900 break-all mt-1">${escapeHtml(api.endpoint)}</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <div>
                            <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Status</span>
                            ${statusBadge}
                        </div>
                        <div>
                            <span class="text-xs font-medium text-gray-500 uppercase block mb-1">Connection</span>
                            ${connectionStatusBadge}
                        </div>
                    </div>
                    <div>
                        <span class="text-xs font-medium text-gray-500 uppercase">Last Checked</span>
                        <p class="text-sm text-gray-600 mt-1">${lastChecked}</p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
                    <button onclick="checkConnection(${api.id})" 
                        class="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 font-medium">
                        Check
                    </button>
                    <button onclick="viewLogs(${api.id}, '${escapeHtml(api.name)}')" 
                        class="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-medium">
                        Logs
                    </button>
                    <button onclick="editAPI(${api.id})" 
                        class="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 font-medium">
                        Edit
                    </button>
                    <button onclick="deleteAPI(${api.id})" 
                        class="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 font-medium">
                        Delete
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        }
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

// View logs for an API
let currentLogsApiId = null;

async function viewLogs(apiId, apiName) {
    currentLogsApiId = apiId;
    document.getElementById('logsTitle').textContent = `Check Logs - ${apiName}`;
    document.getElementById('logsModal').classList.remove('hidden');
    document.getElementById('logsLoading').classList.remove('hidden');
    document.getElementById('logsEmpty').classList.add('hidden');
    document.getElementById('logsContent').classList.add('hidden');
    
    try {
        const response = await fetch(`/logs?apiId=${apiId}&limit=100`);
        const logs = await response.json();
        
        document.getElementById('logsLoading').classList.add('hidden');
        
        if (logs.length === 0) {
            document.getElementById('logsEmpty').classList.remove('hidden');
        } else {
            displayLogs(logs);
        }
    } catch (error) {
        console.error('Error loading logs:', error);
        document.getElementById('logsLoading').classList.add('hidden');
        document.getElementById('logsEmpty').textContent = 'Error loading logs';
        document.getElementById('logsEmpty').classList.remove('hidden');
    }
}

// Get Jenkins-style status indicator
function getStatusIndicator(status, hasError) {
    const isSuccess = status === 'online' && !hasError;
    
    if (isSuccess) {
        // Green circle with checkmark (success)
        return `
            <div class="flex items-center justify-center" title="Success">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.2"/>
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" fill="currentColor"/>
                </svg>
            </div>
        `;
    } else {
        // Red circle with X (failure)
        return `
            <div class="flex items-center justify-center" title="Failed">
                <svg class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.2"/>
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" fill="currentColor"/>
                </svg>
            </div>
        `;
    }
}

// Display logs in table
function displayLogs(logs) {
    const tableBody = document.getElementById('logsTableBody');
    tableBody.innerHTML = '';
    
    logs.forEach(log => {
        const statusBadge = getStatusBadge(log.status);
        const connectionStatusBadge = getConnectionStatusBadge(log.connection_status);
        const statusIndicator = getStatusIndicator(log.status, !!log.error_message);
        const checkedAt = log.checked_at 
            ? new Date(log.checked_at).toLocaleString() 
            : '-';
        const errorMessage = log.error_message ? escapeHtml(log.error_message) : '-';
        const responseData = log.response_data 
            ? `<pre class="text-xs bg-gray-50 p-2 rounded max-w-xs overflow-auto">${escapeHtml(JSON.stringify(log.response_data, null, 2))}</pre>` 
            : '-';
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-center">${statusIndicator}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">${checkedAt}</td>
            <td class="px-4 py-3 whitespace-nowrap">${statusBadge}</td>
            <td class="px-4 py-3 whitespace-nowrap">${connectionStatusBadge}</td>
            <td class="px-4 py-3 text-sm text-gray-900 max-w-xs break-words">${errorMessage}</td>
            <td class="px-4 py-3 text-sm text-gray-900">${responseData}</td>
        `;
        tableBody.appendChild(row);
    });
    
    document.getElementById('logsContent').classList.remove('hidden');
}

// Close logs modal
function closeLogsModal() {
    document.getElementById('logsModal').classList.add('hidden');
    currentLogsApiId = null;
}

