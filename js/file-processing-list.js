const token = localStorage.getItem('token');
let todosArquivos = [];
let paginaAtual = 1;
const arquivosPorPagina = 10;

// Função de formatação de data
function formatarData(dateString) {
    const data = new Date(dateString);
    const userLang = navigator.language || navigator.userLanguage;

    if (userLang.startsWith('en')) {
        const yyyy = data.getFullYear();
        const mm = String(data.getMonth() + 1).padStart(2, '0');
        const dd = String(data.getDate()).padStart(2, '0');
        const hh = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    }

    return data.toLocaleString(userLang);
}

// Evento de carregamento inicial
document.addEventListener('DOMContentLoaded', () => {
    carregarArquivos();
});

// Buscar com filtros

document.getElementById('btn_buscar').addEventListener('click', async () => {
    const filePath = document.getElementById('filtro_Arquivo').value.trim();
    const status = document.getElementById('filtro_status').value;
    const dataInicial = document.getElementById('filtro_data_inicial').value.trim();
    const dataFinal = document.getElementById('filtro_data_final').value.trim();

    const token = localStorage.getItem('token');

    let url = `${BASE_URL}traces?`;

    if (filePath) url += `filePath=${encodeURIComponent(filePath)}&`;
    if (status) url += `status=${status}&`;
    if (dataInicial) url += `createdAfter=${dataInicial}&`;
    if (dataFinal) {
        const dataFinalDate = new Date(dataFinal);
        dataFinalDate.setDate(dataFinalDate.getDate() + 1);
        const dataFinalAjustada = dataFinalDate.toISOString().split('T')[0];
        url += `createdBefore=${dataFinalAjustada}&`;
    }

    try {
        const resposta = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!resposta.ok) {
            const texto = await resposta.text();
            throw new Error(`Erro ${resposta.status}: ${texto}`);
        }

        const resultado = await resposta.json();
        if (!Array.isArray(resultado.data)) {
            throw new Error('Resposta inesperada');
        }

        todosArquivos = resultado.data;
        paginaAtual = 1;
        renderizarPagina();
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
});


// Limpar filtros
document.getElementById('btn_limpar').addEventListener('click', () => {
    document.getElementById('filtro_Arquivo').value = '';
    document.getElementById('filtro_status').value = '';
    document.getElementById('filtro_data_inicial').value = '';
    document.getElementById('filtro_data_final').value = '';
    carregarArquivos();
});

// Carregar todos os arquivos sem filtro
async function carregarArquivos() {
    try {
        const response = await fetch(`${BASE_URL}traces`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        todosArquivos = data.data;
        paginaAtual = 1;
        renderizarPagina();
    } catch (err) {
        console.error('Erro ao carregar arquivos:', err);
    }
}

// Renderiza a página atual
function renderizarPagina() {
    const inicio = (paginaAtual - 1) * arquivosPorPagina;
    const fim = inicio + arquivosPorPagina;
    const dadosPagina = todosArquivos.slice(inicio, fim);
    renderizarTabela(dadosPagina);
    renderizarPaginacao();
}

// Renderiza os dados na tabela com linha extra para accordion
function renderizarTabela(dados) {
    const tbody = document.querySelector('.access-table tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(dados)) {
        console.error('Esperado um array, mas recebido:', dados);
        return;
    }

    dados.forEach((item, index) => {
        // Linha principal da tabela
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.filePath}</td>
            <td>${item.user}</td>
            <td class="${classeStatus(item.status)}">${item.status}</td>
            <td>${formatarData(item.createdTimestamp)}</td>
            <td>${item.lastUpdatedTimestamp ? formatarData(item.lastUpdatedTimestamp) : '-'}</td>
            <td>
                ${item.actions.length} action(s)
                <button class="btn-saiba-mais btnGray_table btn_gap" data-index="${index}">See more</button>
            </td>
        `;

        // Linha extra para o conteúdo da accordion, inicialmente escondida
        const accordionRow = document.createElement('tr');
        accordionRow.classList.add('accordion-row');
        accordionRow.style.display = 'none';
        accordionRow.innerHTML = `
            <td colspan="6" class="accordion-content">
                <ul>
                    ${item.actions.map(action => `
                        <li>${formatarData(action.createdOn)} ${action.action}</li>
                    `).join('')}
                </ul>
            </td>
        `;

        tbody.appendChild(row);
        tbody.appendChild(accordionRow);
    });

    // Evento para os botões "See more"
    document.querySelectorAll('.btn-saiba-mais').forEach(btn => {
        btn.addEventListener('click', () => {
            const accordionRow = btn.closest('tr').nextElementSibling;

            if (accordionRow.style.display === 'table-row') {
                accordionRow.style.display = 'none';
                btn.textContent = 'See more';
            } else {
                accordionRow.style.display = 'table-row';
                btn.textContent = 'See less';
            }
        });
    });
}

// Cria os botões de paginação
function renderizarPaginacao() {
    const paginacaoContainer = document.getElementById('paginacao_container');
    paginacaoContainer.innerHTML = '';

    const totalPaginas = Math.ceil(todosArquivos.length / arquivosPorPagina);

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === paginaAtual) btn.classList.add('active');
        btn.addEventListener('click', () => {
            paginaAtual = i;
            renderizarPagina();
        });
        paginacaoContainer.appendChild(btn);
    }
}

function classeStatus(status) {
    switch (status) {
        case 'PENDING':
            return 'statusPendente';
        case 'IN_PROCESSING':
            return 'statusEmAndamento';
        case 'COMPLETED':
            return 'statusCompleto';
        default:
            return '';
    }
}