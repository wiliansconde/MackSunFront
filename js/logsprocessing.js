async function toggleDetailsFromCache(index) {
    const detailsRow = document.querySelector(`tr[data-details="${index}"]`);
    const button = document.querySelector(`tr[data-index="${index}"] .btn-action`);
    const detailsContent = detailsRow.querySelector('td div');
    
    if (detailsRow) {
        if (detailsRow.style.display === 'none') {
            const item = currentFilteredData[index];
            console.log('Usando dados do cache:', item);
            
            if (item) {
                detailsContent.innerHTML = formatItemDetails(item);
            } else {
                detailsContent.innerHTML = '<p style="color: #dc3545;">Dados do item não encontrados</p>';
            }
            
            detailsRow.style.display = 'table-row';
            button.textContent = 'Close';
            button.classList.remove('btnGray_table');
            button.classList.add('btn-close');
            button.style.backgroundColor = '#dc3545';
        } else {
            detailsRow.style.display = 'none';
            button.textContent = 'View';
            button.classList.add('btnGray_table');
            button.classList.remove('btn-close');
            button.style.backgroundColor = '';
        }
    }
}

const API_URL = 'traces';

let allData = []; 
let currentFilteredData = []; 

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
   
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' 
    });
}

async function fetchData() {
    try {
        const token = localStorage.getItem("token");
        console.log('achei o token', token);
        const response = await fetch(`${BASE_URL}${API_URL}`, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        const normalizedResponse = await response.json();
        return normalizedResponse.data;
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        return null;
    }
}

function formatItemDetails(item) {
    if (!item) {
        return '<p style="color: #dc3545;">Erro ao carregar detalhes</p>';
    }

    let html = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
                <h4 style="margin: 0 0 10px 0; color: #495057;">Informações Gerais</h4>
                <p><strong>ID:</strong> ${item.id || 'N/A'}</p>
                <p><strong>Arquivo:</strong> ${item.filePath || 'N/A'}</p>
                <p><strong>Usuário:</strong> ${item.user || 'N/A'}</p>
                <p><strong>Status:</strong> <span style="padding: 2px 8px; border-radius: 4px; background-color: ${getStatusColor(item.status)}; color: white; font-size: 12px;">${item.status || 'N/A'}</span></p>
            </div>
            <div>
                <h4 style="margin: 0 0 10px 0; color: #495057;">Timestamps</h4>
                <p><strong>Criado em:</strong> ${formatDate(item.createdTimestamp)}</p>
                <p><strong>Última atualização:</strong> ${formatDate(item.lastUpdatedTimestamp)}</p>
            </div>
        </div>
    `;

    if (item.actions && item.actions.length > 0) {
        html += `
            <div>
                <h4 style="margin: 0 0 15px 0; color: #495057;">Histórico de Ações (${item.actions.length})</h4>
                <div style="max-height: 300px; overflow-y: auto;">
        `;
        
        item.actions.forEach((action, index) => {
            html += `
                <div style="border-left: 3px solid #007bff; padding: 10px 15px; margin-bottom: 10px; background-color: #f8f9fa; border-radius: 0 4px 4px 0;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 5px;">
                        <strong style="color: #495057;">Ação ${index + 1}</strong>
                        <small style="color: #6c757d;">${formatDate(action.createdOn)}</small>
                    </div>
                    <p style="margin: 0; word-wrap: break-word;">${action.action || 'Ação não especificada'}</p>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    } else {
        html += '<p style="color: #6c757d; font-style: italic;">Nenhuma ação registrada</p>';
    }

    return html;
}

// Função toggleDetails atualizada para usar dados já disponíveis
async function toggleDetails(index) {
    const detailsRow = document.querySelector(`tr[data-details="${index}"]`);
    const button = document.querySelector(`tr[data-index="${index}"] .btn-action`);
    const detailsContent = detailsRow.querySelector('td div');
    
    if (detailsRow) {
        if (detailsRow.style.display === 'none') {
            button.textContent = 'Loading...';
            button.disabled = true;
        
            const item = currentFilteredData[index];
            console.log('Item selecionado:', item);
            
            if (item) {
                // Os dados já estão disponíveis, não precisa fazer chamada à API
                console.log('Usando dados já disponíveis');
                console.log('Actions encontradas:', item.actions);
                
                // Simular um pequeno delay para melhor UX
                setTimeout(() => {
                    try {
                        detailsContent.innerHTML = formatItemDetails(item);
                        console.log('Detalhes formatados com sucesso');
                    } catch (error) {
                        console.error('Erro ao formatar detalhes:', error);
                        detailsContent.innerHTML = createFallbackDetails(item);
                    }
                    
                    detailsRow.style.display = 'table-row';
                    button.textContent = 'Close';
                    button.classList.remove('btnGray_table');
                    button.classList.add('btn-close');
                    button.style.backgroundColor = '#dc3545';
                    button.disabled = false;
                }, 100);
                
            } else {
                console.error('Item não encontrado no índice:', index);
                detailsContent.innerHTML = '<p style="color: #dc3545;">Item não encontrado</p>';
                
                detailsRow.style.display = 'table-row';
                button.textContent = 'Close';
                button.classList.remove('btnGray_table');
                button.classList.add('btn-close');  
                button.style.backgroundColor = '#dc3545';
                button.disabled = false;
            }
        } else {
            detailsRow.style.display = 'none';
            button.textContent = 'View';
            button.classList.add('btnGray_table');
            button.classList.remove('btn-close');
            button.style.backgroundColor = '';
            button.disabled = false;
        }
    }
}

/// Função para formatar apenas os actions do item
function formatItemDetails(item) {
    let actionsHTML = '';
    
    if (item.actions && Array.isArray(item.actions)) {
        actionsHTML = item.actions.map((action, index) => `
            <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 6px; font-weight: 500;">
                    ${action.createdOn}
                </div>
                <div style="color: #495057; line-height: 1.4;">
                    ${action.action}
                </div>
            </div>
        `).join('');
    } else {
        actionsHTML = '<p style="color: #6c757d; font-style: italic; text-align: center; padding: 20px;">Nenhuma ação encontrada</p>';
    }
    
    return `
        <div style="padding: 15px; background: #fff; border-radius: 5px;">
            <h6 style="margin-bottom: 15px; color: #495057; font-weight: 600; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">
                Action History
            </h6>
            ${actionsHTML}
        </div>
    `;
}

function createFallbackDetails(item) {
    let actionsHTML = '';
    
    if (item.actions && Array.isArray(item.actions)) {
        actionsHTML = item.actions.map((action, index) => `
            <div style="margin-bottom: 12px; padding: 12px; background: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-size: 11px; color: #6c757d; margin-bottom: 6px; font-weight: 500;">
                    ${new Date(action.createdOn).toLocaleString('pt-BR')}
                </div>
                <div style="color: #495057; line-height: 1.4;">
                    ${action.action}
                </div>
            </div>
        `).join('');
    } else {
        actionsHTML = '<p style="color: #6c757d; font-style: italic; text-align: center; padding: 20px;">Nenhuma ação encontrada</p>';
    }
    
    return `
        <div style="padding: 15px; background: #fff; border-radius: 5px;">
            <h6 style="margin-bottom: 15px; color: #495057; font-weight: 600; border-bottom: 1px solid #dee2e6; padding-bottom: 8px;">
                Histórico de Ações
            </h6>
            ${actionsHTML}
        </div>
    `;
}


function filterData(data, startDate, endDate, status, instrument, textFilter) {
    return data.filter(item => {
        let matchesStatus = true;
        if (status) {
            matchesStatus = item.status === status;
        }

        let matchesInstrument = true;
        if (instrument) {
            const filePathUpper = item.filePath ? item.filePath.toUpperCase() : '';
            matchesInstrument = filePathUpper.includes(instrument.toUpperCase());
        }

        let matchesText = true;
        if (textFilter && textFilter.trim()) {
            const searchText = textFilter.trim().toLowerCase();
            const filePath = item.filePath ? item.filePath.toLowerCase() : '';
            const user = item.user ? item.user.toLowerCase() : '';
            const status = item.status ? item.status.toLowerCase() : '';
            
            matchesText = filePath.includes(searchText) || 
                         user.includes(searchText) || 
                         status.includes(searchText);
        }

        let matchesDate = true;
        if (startDate || endDate) {
            const createdDate = new Date(item.createdTimestamp);
            
            if (isNaN(createdDate.getTime())) {
                matchesDate = false;
            } else {
                
                const itemDate = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
                
                let matchesStartDate = true;
                let matchesEndDate = true;

                if (startDate) {
                    const filterStartDate = new Date(startDate);
                    const normalizedStartDate = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate());
                    matchesStartDate = itemDate >= normalizedStartDate;
                }

                if (endDate) {
                    const filterEndDate = new Date(endDate);
                    const normalizedEndDate = new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), filterEndDate.getDate());
                    matchesEndDate = itemDate <= normalizedEndDate;
                }

                matchesDate = matchesStartDate && matchesEndDate;
            }
        }

        return matchesStatus && matchesInstrument && matchesDate && matchesText;
    });
}

function populateTable(data) {
    const tbody = document.querySelector('.access-table tbody');

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum dado encontrado</td></tr>';
        return;
    }

    data?.forEach((item, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-index', index);

        row.innerHTML = `
            <td>${item.filePath}</td>
            <td>${item.user}</td>
            <td>${item.status}</td>
            <td>${formatDate(item.createdTimestamp)}</td>
            <td>${formatDate(item.lastUpdatedTimestamp)}</td>
            <td>
                <button class="btn-action btnGray_table" onclick="toggleDetails(${index})">View</button>
            </td>
        `;

        tbody.appendChild(row);

        const detailsRow = document.createElement('tr');
        detailsRow.setAttribute('data-details', index);
        detailsRow.style.display = 'none';
        detailsRow.innerHTML = `
            <td colspan="6" style="padding: 0; background-color: #f8f9fa; border-left: 3px solid #007bff;">
                <div style="padding: 20px;">
                    <p style="text-align: center; color: #6c757d;">Clique em "View" para carregar os detalhes...</p>
                </div>
            </td>
        `;

        tbody.appendChild(detailsRow);
    });
}

function applyFilters() {
    const startDateInput = document.getElementById('dataInicial');
    const endDateInput = document.getElementById('dataFinal');
    const statusSelect = document.getElementById('filtroStatus');
    const instrumentSelect = document.getElementById('filtroInstrumentos');
    const textFilterInput = document.getElementById('filtroPorErros'); 
    
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateInput.value : null;
    const status = statusSelect ? statusSelect.value : null;
    const instrument = instrumentSelect ? instrumentSelect.value : null;
    const textFilter = textFilterInput ? textFilterInput.value : null;

    console.log('Filtrando por:', { startDate, endDate, status, instrument, textFilter });

    const filteredData = filterData(allData, startDate, endDate, status, instrument, textFilter);
    currentFilteredData = filteredData; 
    populateTable(filteredData);
}

function clearFilters() {
    const startDateInput = document.getElementById('dataInicial');
    const endDateInput = document.getElementById('dataFinal');
    const statusSelect = document.getElementById('filtroStatus');
    const instrumentSelect = document.getElementById('filtroInstrumentos');
    const textFilterInput = document.getElementById('filtroPorErros'); 
    
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (instrumentSelect) instrumentSelect.value = '';
    if (textFilterInput) textFilterInput.value = ''; 
    
    currentFilteredData = allData; 
    populateTable(allData);
}

document.addEventListener('DOMContentLoaded', async function() {
    const data = await fetchData();
    if (data) {
        allData = data; 
        currentFilteredData = data; 
        populateTable(data);
        
        const searchButton = document.getElementById('btn_buscar');
        const clearButton = document.getElementById('btn_limpar');

        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                applyFilters();
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', (e) => {
                e.preventDefault();
                clearFilters();
            });
        }
    }
});

const style = document.createElement('style');
style.textContent = `
    .btn-close {
        background-color: #dc3545 !important;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }
    
    .btn-close:hover {
        background-color: #cc141d !important;
    }
`;
document.head.appendChild(style);