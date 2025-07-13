const token = localStorage.getItem('token');
let todosArquivos = [];
let paginaAtual = 1;
const arquivosPorPagina = 10;

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

document.addEventListener('DOMContentLoaded', () => {
    carregarArquivos();
});

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

document.getElementById('btn_limpar').addEventListener('click', () => {
    document.getElementById('filtro_Arquivo').value = '';
    document.getElementById('filtro_status').value = '';
    document.getElementById('filtro_data_inicial').value = '';
    document.getElementById('filtro_data_final').value = '';
    carregarArquivos();
});

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

function renderizarPagina() {
    const inicio = (paginaAtual - 1) * arquivosPorPagina;
    const fim = inicio + arquivosPorPagina;
    const dadosPagina = todosArquivos.slice(inicio, fim);
    renderizarTabela(dadosPagina);
    renderizarPaginacao();
}

function renderizarTabela(dados) {
    const tbody = document.querySelector('.access-table tbody');
    tbody.innerHTML = '';

    if (!Array.isArray(dados)) {
        console.error('Esperado um array, mas recebido:', dados);
        return;
    }

    dados.forEach((item, index) => {
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

function renderizarPaginacao() {
    const paginacaoContainer = document.getElementById('paginacao_container');
    paginacaoContainer.innerHTML = '';

    const totalPaginas = Math.ceil(todosArquivos.length / arquivosPorPagina);

    function criarBotao(text, pagina, isActive = false, isDisabled = false) {
        const btn = document.createElement('button');
        btn.textContent = text;
        if (isActive) btn.classList.add('active');
        if (isDisabled) btn.disabled = true;
        btn.addEventListener('click', () => {
            if (!isDisabled) {
                paginaAtual = pagina;
                renderizarPagina();
            }
        });
        paginacaoContainer.appendChild(btn);
    }

    criarBotao('Previous', paginaAtual - 1, false, paginaAtual === 1);

    criarBotao('1', 1, paginaAtual === 1);

    function criarPontos() {
        const span = document.createElement('span');
        span.textContent = '...';
        span.classList.add('dots');
        paginacaoContainer.appendChild(span);
    }

    if (totalPaginas <= 7) {
        for (let i = 2; i <= totalPaginas; i++) {
            criarBotao(i.toString(), i, paginaAtual === i);
        }
    } else {

        if (paginaAtual <= 5) {
            for (let i = 2; i <= 5; i++) {
                criarBotao(i.toString(), i, paginaAtual === i);
            }
            criarPontos();
            criarBotao(totalPaginas.toString(), totalPaginas, paginaAtual === totalPaginas);

        } else if (paginaAtual >= totalPaginas - 4) {
            criarPontos();
            for (let i = totalPaginas - 4; i < totalPaginas; i++) {
                criarBotao(i.toString(), i, paginaAtual === i);
            }
            criarBotao(totalPaginas.toString(), totalPaginas, paginaAtual === totalPaginas);

        } else {
            criarPontos();
            for (let i = paginaAtual - 1; i <= paginaAtual + 1; i++) {
                criarBotao(i.toString(), i, paginaAtual === i);
            }
            criarPontos();
            criarBotao(totalPaginas.toString(), totalPaginas, paginaAtual === totalPaginas);
        }
    }

    criarBotao('Next', paginaAtual + 1, false, paginaAtual === totalPaginas);
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