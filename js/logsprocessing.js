// URL da sua API
const API_URL = 'traces';

// Função para formatar data
function formatDate(timestamp) {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Função para buscar dados da API
async function fetchData() {
    try {
        const token = localStorage.getItem("token");
        console.log('achei o token',token);
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
    data?.map(item => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${item.filePath}</td>
            <td>${item.user}</td>
            <td>${item.status}</td>
            <td>${formatDate(item.createdTimestamp)}</td>
            <td>${formatDate(item.lastUpdatedTimestamp)}</td>
            <td>
                <button class="btn-action">View</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    const data = await fetchData();
    if (data) {
        populateTable(data);
    }
});

// Se você tiver dados de exemplo para testar, descomente as linhas abaixo:
/*
const dadosExemplo = [
    {
        "id": "67f478080485cb04c95c839c",
        "filePath": "POEMAS\\2012\\M07\\D09\\SunTrack_120709_180002.TRK",
        "user": "system_initial_load",
        "createdTimestamp": "2025-04-08T01:12:32.240Z",
        "lastUpdatedTimestamp": null,
        "status": "PENDING",
        "actions": [
            {
                "createdOn": "2025-04-08T01:12:32.240Z",
                "action": "File added to queue: POEMAS\\2012\\M07\\D09\\SunTrack_120709_180002.TRK"
            }
        ]
    }
];

// Para testar com dados de exemplo, descomente esta linha:
// populateTable(dadosExemplo);
*/