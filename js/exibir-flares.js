let tbody = null;
let modalVisualizarFlare = null;
let mensagemErro = null;

let todosFlares = [];
let paginaAtual = 1;
const flaresPorPagina = 10;

const userLang = navigator.language || 'en-US';

function formatarData(dateString) {
    const data = new Date(dateString);
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

async function listarFlares(url = `${BASE_URL}flares/public`) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error fetching flares');
        }
        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error listing flares:', error);
        throw error;
    }
}

function buscarFlarePorIdLocal(id) {
    const flare = todosFlares.find(f => f.id === id);
    if (!flare) throw new Error('Flare not found locally.');
    return flare;
}

function preencherTabela(flares) {
    if (!tbody) {
        console.error("Error: tbody is not initialized.");
        return;
    }

    tbody.innerHTML = '';

    if (!flares || flares.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `<td colspan="5">flare not found.</td>`;
        return;
    }

    flares.forEach(flare => {
        const row = tbody.insertRow();
        const dataFormatada = flare.dateTime ? formatarData(flare.dateTime) : 'No date'; // Traduzido
        const descricaoLimitada = flare.description
            ? (flare.description.length > 80 ? flare.description.slice(0, 80) + '...' : flare.description)
            : '-';
        const telescopesFormatados = flare.telescopes
            ? (Array.isArray(flare.telescopes) ? flare.telescopes.join(', ') : flare.telescopes.replace(/;/g, ', '))
            : '-';

        row.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${flare.classType || ''}</td>
            <td>${telescopesFormatados}</td>
            <td>${descricaoLimitada}</td>
            <td>
                <button class="btnGray_table btn_gap" onclick="abrirModalView('${flare.id}')">View</button>
            </td>
        `;
    });
}

function renderizarPagina() {
    const inicio = (paginaAtual - 1) * flaresPorPagina;
    const fim = inicio + flaresPorPagina;
    const flaresPaginados = todosFlares.slice(inicio, fim);
    preencherTabela(flaresPaginados);
    renderizarPaginacao();
}

function renderizarPaginacao() {
    const paginacaoContainer = document.getElementById('paginacao_container');
    if (!paginacaoContainer) return;

    paginacaoContainer.innerHTML = '';
    const totalPaginas = Math.ceil(todosFlares.length / flaresPorPagina);

    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === paginaAtual ? 'active' : '';
        btn.addEventListener('click', () => {
            paginaAtual = i;
            renderizarPagina();
        });
        paginacaoContainer.appendChild(btn);
    }
}

window.abrirModalView = function (id) {
    try {
        const flare = buscarFlarePorIdLocal(id);
        if (!modalVisualizarFlare) return;

        document.getElementById('view_data_evento').value = formatarData(flare.dateTime || '');
        document.getElementById('view_classificacao_flare').value = flare.classType || '';
        document.getElementById('view_telescopios').value = Array.isArray(flare.telescopes)
            ? flare.telescopes.join(', ')
            : (flare.telescopes ? flare.telescopes.replace(/;/g, ', ') : '-');
        document.getElementById('view_descricao_adicional').value = flare.description || '-';

        modalVisualizarFlare.style.display = 'flex';
    } catch (error) {
        console.error("Error opening modal:", error.message);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    tbody = document.getElementById('tbody_flares');
    modalVisualizarFlare = document.getElementById('modal_visualizar');

    mensagemErro = document.createElement('div');
    mensagemErro.style.color = 'red';
    mensagemErro.style.display = 'none';
    mensagemErro.style.marginTop = '10px';
    document.querySelector('.formulario-card_medio')?.appendChild(mensagemErro);

    document.getElementById('btn_buscar')?.addEventListener('click', async () => {
        let dataFiltro = document.getElementById('filtro_data').value;
        const classificacaoFiltro = document.getElementById('filtro_classificacao').value.trim();
        const telescopioFiltro = document.getElementById('filtro_telescopio').value.trim();
        const descricaoFiltro = document.getElementById('filtro_descricao').value.trim();

        if (dataFiltro) {
            // Remove todos os caracteres não-dígitos
            const apenasDigitos = dataFiltro.replace(/\D/g, ''); 
            
            if (apenasDigitos.length === 8) {
                dataFiltro = `${apenasDigitos.substring(0, 4)}-${apenasDigitos.substring(4, 6)}-${apenasDigitos.substring(6, 8)}`;
            } 
            else if (apenasDigitos.length === 6) {
                dataFiltro = `${apenasDigitos.substring(0, 4)}-${apenasDigitos.substring(4, 6)}`;
            }
        }

        let url = `${BASE_URL}flares/public?`; 
        const params = [];

        if (dataFiltro) params.push(`date=${encodeURIComponent(dataFiltro)}`);
        if (classificacaoFiltro) params.push(`classType=${encodeURIComponent(classificacaoFiltro)}`);
        if (telescopioFiltro) params.push(`telescopes=${encodeURIComponent(telescopioFiltro)}`);
        if (descricaoFiltro) params.push(`description=${encodeURIComponent(descricaoFiltro)}`);

        url += params.join('&');

        try {
            const flaresFiltrados = await listarFlares(url);
            todosFlares = flaresFiltrados;
            paginaAtual = 1;
            renderizarPagina();
            mensagemErro.style.display = 'none';
        } catch (error) {
            mensagemErro.textContent = `Error when applying filter: ${error.message}`;
            mensagemErro.style.display = 'block';
            preencherTabela([]);
        }
    });

    document.getElementById('btn_limpar_filtro')?.addEventListener('click', () => {
        document.getElementById('filtro_data').value = '';
        document.getElementById('filtro_classificacao').value = '';
        document.getElementById('filtro_telescopio').value = '';
        document.getElementById('filtro_descricao').value = '';
        carregarFlares();
    });

    document.getElementById('cancelar_flare_editar')?.addEventListener('click', () => {
        modalVisualizarFlare.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalVisualizarFlare) {
            modalVisualizarFlare.style.display = 'none';
        }
    });

    carregarFlares();
});

async function carregarFlares() {
    try {
        const flares = await listarFlares();
        todosFlares = flares;
        paginaAtual = 1;
        renderizarPagina();
        mensagemErro.style.display = 'none';
    } catch (error) {
        mensagemErro.textContent = `Error loading flare: ${error.message}`;
        mensagemErro.style.display = 'block';
        preencherTabela([]);
    }
}