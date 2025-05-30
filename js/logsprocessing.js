// Função para alternar a exibição dos detalhes (versão alternativa - usa dados já carregados)
async function toggleDetailsFromCache(index) {
    const detailsRow = document.querySelector(`tr[data-details="${index}"]`);
    const button = document.querySelector(`tr[data-index="${index}"] .btn-action`);
    const detailsContent = detailsRow.querySelector('td div');
    
    if (detailsRow) {
        if (detailsRow.style.display === 'none') {
            // Usar dados já carregados
            const item = currentFilteredData[index];
            console.log('Usando dados do cache:', item);
            
            if (item) {
                detailsContent.innerHTML = formatItemDetails(item);
            } else {
                detailsContent.innerHTML = '<p style="color: #dc3545;">Dados do item não encontrados</p>';
            }
            
            // Mostrar a linha
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

let allData = []; // Armazenar todos os dados para filtrar
let currentFilteredData = []; // Dados atualmente filtrados para manter referência

function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
   
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC' // Força usar UTC
    });
}


// Função para formatar o conteúdo dos detalhes completos
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

// Função para obter cor do status
function getStatusColor(status) {
    switch(status?.toUpperCase()) {
        case 'PENDING': return '#0E7AB4';
        case 'PROCESSING': return '#DB4B16';
        case 'COMPLETED': return '#1ca83d';
        case 'ERROR': return '#cc141d';
        case 'FAILED': return '#cc141d';
        default: return '#6c757d';
    }
}

// Função para alternar a exibição dos detalhes
async function toggleDetails(index) {
    const detailsRow = document.querySelector(`tr[data-details="${index}"]`);
    const button = document.querySelector(`tr[data-index="${index}"] .btn-action`);
    const detailsContent = detailsRow.querySelector('td div');
    
    if (detailsRow) {
        if (detailsRow.style.display === 'none') {
            // Mostrar loading
            button.textContent = 'Loading...';
            button.disabled = true;
            
            // Buscar detalhes da API
            const item = currentFilteredData[index];
            console.log('Item selecionado:', item);
            
            if (item && item.id) {
                console.log('Buscando detalhes para ID:', item.id);
                const itemDetails = await fetchItemDetails(item.id);
                
                if (itemDetails) {
                    console.log('Detalhes recebidos:', itemDetails);
                    detailsContent.innerHTML = formatItemDetails(itemDetails);
                } else {
                    console.error('Nenhum detalhe retornado da API');
                    detailsContent.innerHTML = `
                        <p style="color: #dc3545;">Erro ao carregar detalhes do servidor</p>
                        <p style="color: #6c757d; font-size: 12px;">
                            Verifique o console do navegador para mais detalhes.<br>
                            ID tentado: ${item.id}<br>
                            URL: ${BASE_URL}${API_URL}/${item.id}
                        </p>
                    `;
                }
            } else {
                console.error('Item ou ID não encontrado:', item);
                detailsContent.innerHTML = '<p style="color: #dc3545;">ID do item não encontrado</p>';
            }
            
            // Mostrar a linha
            detailsRow.style.display = 'table-row';
            button.textContent = 'Close';
            button.classList.remove('btnGray_table');
            button.classList.add('btn-close');
            button.style.backgroundColor = '#dc3545';
            button.disabled = false;
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

// Função para buscar detalhes específicos de um item por ID
async function fetchItemDetails(itemId) {
    try {
        const token = localStorage.getItem("token");
        const url = `${BASE_URL}${API_URL}/${itemId}`;
        
        console.log('Buscando detalhes para:', itemId);
        console.log('URL completa:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        console.log('Status da resposta:', response.status);
        console.log('Response OK:', response.ok);

        if (!response.ok) {
            console.error('Erro na resposta:', response.status, response.statusText);
            return null;
        }

        const normalizedResponse = await response.json();
        console.log('Resposta da API:', normalizedResponse);
        
        return normalizedResponse.data || normalizedResponse;
    } catch (error) {
        console.error('Erro ao buscar detalhes do item:', error);
        return null;
    }
}

// Função para filtrar dados por data, status, instrumento e texto
function filterData(data, startDate, endDate, status, instrument, textFilter) {
    return data.filter(item => {
        // Filtro de status
        let matchesStatus = true;
        if (status) {
            matchesStatus = item.status === status;
        }

        // Filtro de instrumento
        let matchesInstrument = true;
        if (instrument) {
            // Verificar se o filePath contém o nome do instrumento
            const filePathUpper = item.filePath ? item.filePath.toUpperCase() : '';
            matchesInstrument = filePathUpper.includes(instrument.toUpperCase());
        }

        // Filtro de texto livre (busca em todos os campos relevantes)
        let matchesText = true;
        if (textFilter && textFilter.trim()) {
            const searchText = textFilter.trim().toLowerCase();
            const filePath = item.filePath ? item.filePath.toLowerCase() : '';
            const user = item.user ? item.user.toLowerCase() : '';
            const status = item.status ? item.status.toLowerCase() : '';
            
            // Buscar o texto em filePath, user ou status
            matchesText = filePath.includes(searchText) || 
                         user.includes(searchText) || 
                         status.includes(searchText);
        }

        // Filtro de data
        let matchesDate = true;
        if (startDate || endDate) {
            const createdDate = new Date(item.createdTimestamp);
            
            // Verificar se a data é válida
            if (isNaN(createdDate.getTime())) {
                matchesDate = false;
            } else {
                // Normalizar as datas para comparação (sem horário)
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

// Função para popular a tabela
function populateTable(data) {
    const tbody = document.querySelector('.access-table tbody');

    // Limpar tabela
    tbody.innerHTML = '';

    // Se não há dados
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum dado encontrado</td></tr>';
        return;
    }

    // Adicionar cada item na tabela
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

        // Criar linha de detalhes (inicialmente oculta)
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

// Função para aplicar filtros
function applyFilters() {
    const startDateInput = document.getElementById('dataInicial');
    const endDateInput = document.getElementById('dataFinal');
    const statusSelect = document.getElementById('filtroStatus');
    const instrumentSelect = document.getElementById('filtroInstrumentos');
    const textFilterInput = document.getElementById('filtroPorErros'); // Campo de filtro de texto
    
    const startDate = startDateInput ? startDateInput.value : null;
    const endDate = endDateInput ? endDateInput.value : null;
    const status = statusSelect ? statusSelect.value : null;
    const instrument = instrumentSelect ? instrumentSelect.value : null;
    const textFilter = textFilterInput ? textFilterInput.value : null;

    console.log('Filtrando por:', { startDate, endDate, status, instrument, textFilter });

    const filteredData = filterData(allData, startDate, endDate, status, instrument, textFilter);
    currentFilteredData = filteredData; // Manter referência dos dados filtrados
    populateTable(filteredData);
}

// Função para limpar filtros
function clearFilters() {
    const startDateInput = document.getElementById('dataInicial');
    const endDateInput = document.getElementById('dataFinal');
    const statusSelect = document.getElementById('filtroStatus');
    const instrumentSelect = document.getElementById('filtroInstrumentos');
    const textFilterInput = document.getElementById('filtroPorErros'); // Campo de filtro de texto
    
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (instrumentSelect) instrumentSelect.value = '';
    if (textFilterInput) textFilterInput.value = ''; // Limpar campo de texto
    
    currentFilteredData = allData; // Resetar dados filtrados
    populateTable(allData); // Mostrar todos os dados
}

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    const data = await fetchData();
    if (data) {
        allData = data; // Armazenar todos os dados
        currentFilteredData = data; // Inicializar dados filtrados
        populateTable(data);
        
        // Adicionar event listeners apenas para os botões
        const searchButton = document.getElementById('btn_buscar');
        const clearButton = document.getElementById('btn_limpar');

        // Se houver botão de busca, adicionar evento
        if (searchButton) {
            searchButton.addEventListener('click', (e) => {
                e.preventDefault();
                applyFilters();
            });
        }

        // Se houver botão de limpar, adicionar evento
        if (clearButton) {
            clearButton.addEventListener('click', (e) => {
                e.preventDefault();
                clearFilters();
            });
        }
    }
});

// Adicionar CSS para o botão Close com hover
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