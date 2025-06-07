const token = localStorage.getItem('token');

const tbody = document.getElementById('tbody_flares');
const modalNovoFlare = document.getElementById('modal_novo_flare_solar');
const modalEditarFlare = document.getElementById('modal_editar_evento');
const modalExcluirFlare = document.getElementById('modal_excluir_evento');

const btnAtivarEdicao = document.getElementById('btn_ativar_edicao');
const btnSalvarEdicao = document.getElementById('btn_salvar_edicao');
const btnCancelarEdicao = document.getElementById('cancelar_flare_editar');

const mensagemSucesso = document.getElementById('mensagem_sucesso_flare');
const mensagemErro = document.getElementById('mensagem_erro_flare');

const mensagemSucessoEditar = document.getElementById('mensagem_sucesso_editar_flare');
const mensagemErroEditar = document.getElementById('mensagem-erro-editar_flare');

const mensagemSucessoExcluir = document.getElementById('mensagem_sucesso_excluir');
const mensagemErroExcluir = document.getElementById('mensagem-erro-excluir');

const toggleTelescopios = document.getElementById('dropdownToggleTelescopios');
const contentTelescopios = document.getElementById('dropdownContentTelescopiosNovo');

const toggleTelescopiosEditar = document.getElementById('dropdownAlternarTelescopiosEditar');
const contentTelescopiosEditar = document.getElementById('dropdownContentTelescopiosEditar');

let idEditar = null;
let idExcluir = null;

let todosFlares = [];
let paginaAtual = 1;
const flaresPorPagina = 10;

const userLang = navigator.language || 'en-US';


if (toggleTelescopios) {
    toggleTelescopios.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = contentTelescopios.style.display === 'block';
        contentTelescopios.style.display = isOpen ? 'none' : 'block';
        toggleTelescopios.classList.toggle('active', !isOpen);
    });
}

if (toggleTelescopiosEditar) {
    toggleTelescopiosEditar.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = contentTelescopiosEditar.style.display === 'block';
        contentTelescopiosEditar.style.display = isOpen ? 'none' : 'block';
        toggleTelescopiosEditar.classList.toggle('active', !isOpen);
    });
}

window.addEventListener('click', (e) => {
    if (contentTelescopios && !contentTelescopios.contains(e.target) && !toggleTelescopios.contains(e.target)) {
        contentTelescopios.style.display = 'none';
        toggleTelescopios.classList.remove('active');
    }

    if (contentTelescopiosEditar && !contentTelescopiosEditar.contains(e.target) && !toggleTelescopiosEditar.contains(e.target)) {
        contentTelescopiosEditar.style.display = 'none';
        toggleTelescopiosEditar.classList.remove('active');
    }
});

function esconderMensagens() {
    document.querySelectorAll('.valid_message_error, .invalid_message_error').forEach(el => {
        el.style.display = 'none';
    });
}

function exibirMensagensERecarregar(mensagemElemento, modalElemento, tempo = 1500) {
    mensagemElemento.style.display = 'block';

    setTimeout(() => {
        mensagemElemento.style.display = 'none';
        modalElemento.style.display = 'none';
        carregarFlares();
    }, tempo);
}

function obterTelescopiosSelecionados(containerId = 'dropdownContentTelescopiosNovo') {
    const checkboxes = document.querySelectorAll(`#${containerId} input[name="telescopios"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function setModoVisualizacaoEditar(isVisualizacao) {
    const campos = [
        document.getElementById('editar_data_evento'),
        document.getElementById('editar_classificacao_flare'),
        document.getElementById('editar_descricao_adicional'),
    ];

    const checkboxes = document.querySelectorAll('#dropdownContentTelescopiosEditar input[type="checkbox"]');

    campos.forEach(campo => campo.disabled = isVisualizacao);
    checkboxes.forEach(cb => cb.disabled = isVisualizacao);

    btnAtivarEdicao.style.display = isVisualizacao ? 'inline-block' : 'none';
    btnSalvarEdicao.classList.toggle('esconder', isVisualizacao);
}

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

async function listarFlares() {
    const response = await fetch(`${BASE_URL}flares`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error fetching flares');
    const result = await response.json();
    return result.data;
}

function buscarFlarePorIdLocal(id) {
    const flare = todosFlares.find(f => f.id === id);
    if (!flare) throw new Error('Flare not found');
    return flare;
}

async function cadastrarFlare(flare) {
    try {
        const dateTimeFormatted = flare.dateTime.replace(' ', 'T') + ':00';

        const telescopesString = Array.isArray(flare.telescopes)
            ? flare.telescopes.join(';')
            : flare.telescopes;

        console.log('Payload enviado:', {
            dateTime: dateTimeFormatted,
            classType: flare.classType,
            description: flare.description,
            telescopes: telescopesString
        });

        const response = await fetch(`${BASE_URL}flares`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                dateTime: dateTimeFormatted,
                classType: flare.classType,
                description: flare.description,
                telescopes: telescopesString
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na requisição:', errorData);
            throw new Error('Error registering flare');
        }

        const result = await response.json();
        console.log('Flare cadastrado com sucesso:', result);
        return result;
    } catch (error) {
        console.error('Erro ao cadastrar flare:', error);
        throw error;
    }
}

async function atualizarFlare(id, flare) {
    try {
        const dateTimeFormatted = flare.dateTime.replace(' ', 'T') + ':00';

        const telescopesString = Array.isArray(flare.telescopes)
            ? flare.telescopes.join(';')
            : flare.telescopes;

        const response = await fetch(`${BASE_URL}flares/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                dateTime: dateTimeFormatted,
                classType: flare.classType,
                description: flare.description,
                telescopes: telescopesString
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erro na atualização:', errorData);
            throw new Error('Error updating flare');
        }

        const result = await response.json();
        console.log('Flare atualizado com sucesso:', result);
        return result;
    } catch (error) {
        console.error('Erro ao atualizar flare:', error);
        throw error;
    }
}

async function deletarFlare(id) {
    const response = await fetch(`${BASE_URL}flares/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Error deleting flare');
    const result = await response.json();
    carregarFlares();
    return result;
}


async function carregarFlares() {
    try {
        const flares = await listarFlares();
        todosFlares = flares;
        paginaAtual = 1;
        renderizarPagina();
    } catch (error) {
        mensagemErro.textContent = error.message;
        mensagemErro.style.display = 'block';
    }
}

async function carregarTelescopios() {
    try {
        const response = await fetch(`${BASE_URL}instruments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error loading telescopes');
        const result = await response.json();
        if (!result.success) throw new Error('Failed to obtain data from telescopes');

        const telescopios = result.data || [];
        preencherDropdownTelescopios('dropdownContentTelescopiosNovo', telescopios);
        preencherDropdownTelescopios('dropdownContentTelescopiosEditar', telescopios);
    } catch (error) {
        console.error(error);
    }
}

function preencherDropdownTelescopios(containerId, telescopios) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    telescopios.forEach(t => {
        const label = document.createElement('label');
        label.style.display = 'block';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'telescopios';
        checkbox.value = t.name;

        label.appendChild(checkbox);
        label.append(` ${t.name}`);
        container.appendChild(label);
    });
}

function preencherTabela(flares) {
    tbody.innerHTML = '';
    console.log(flares)

    if (!flares || flares.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `<td colspan="5">No flares found.</td>`;
        return;
    }

    flares.forEach(flare => {
        const row = tbody.insertRow();
        const dataFormatada = flare.dateTime
            ? formatarData(flare.dateTime)
            : 'No date';

        const descricaoLimitada = flare.description
            ? (flare.description.length > 80
                ? flare.description.slice(0, 80) + '...'
                : flare.description)
            : '-';

        row.innerHTML = `
            <td>${dataFormatada}</td>
            <td>${flare.classType || ''}</td>
            <td>${flare.telescopes
                ? (Array.isArray(flare.telescopes)
                    ? flare.telescopes.join(', ')
                    : flare.telescopes.replace(/;/g, ', '))
                : '-'}</td>
            <td>${descricaoLimitada}</td>
            <td>
                <button class="btnGray_table btn_gap" onclick="abrirModalEditar('${flare.id}')">View/Edit</button>
                <button class="btnGray_table btn_gap" onclick="abrirModalExcluir('${flare.id}')">Delete</button>
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
    paginacaoContainer.innerHTML = '';

    const totalPaginas = Math.ceil(todosFlares.length / flaresPorPagina);

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


document.getElementById('btn_buscar').addEventListener('click', async () => {
    const dataFiltro = document.getElementById('filtro_data').value;
    const classificacaoFiltro = document.getElementById('filtro_classificacao').value.trim();
    const telescopioFiltro = document.getElementById('filtro_telescopio').value.trim();
    const descricaoFiltro = document.getElementById('filtro_descricao').value.trim();

    let url = `${BASE_URL}flares?`;

    const params = [];

    if (dataFiltro) {
        params.push(`date=${encodeURIComponent(dataFiltro)}`);
    }
    if (classificacaoFiltro) {
        params.push(`classType=${encodeURIComponent(classificacaoFiltro)}`);
    }
    if (telescopioFiltro) {
        params.push(`telescopes=${encodeURIComponent(telescopioFiltro)}`);
    }
    if (descricaoFiltro) {
        params.push(`description=${encodeURIComponent(descricaoFiltro)}`);
    }

    url += params.join('&');

    console.log('URL da busca:', url);

    try {
        const resposta = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!resposta.ok) throw new Error('Error fetching flares');

        const resultado = await resposta.json();
        todosFlares = resultado.data;
        paginaAtual = 1;
        renderizarPagina();

    } catch (error) {
        mensagemErro.textContent = error.message;
        mensagemErro.style.display = 'block';
    }
});

document.getElementById('btn_limpar_filtro').addEventListener('click', () => {
    document.getElementById('filtro_data').value = '';
    document.getElementById('filtro_classificacao').value = '';
    document.getElementById('filtro_telescopio').value = '';
    document.getElementById('filtro_descricao').value = '';
    carregarFlares();
});


document.getElementById('btn_adicionar_flare').addEventListener('click', () => {
    modalNovoFlare.style.display = 'flex';
    document.getElementById('form_novo_flare_solar').reset();
    esconderMensagens();
});

document.getElementById('cancelar_flare_solar').addEventListener('click', () => {
    modalNovoFlare.style.display = 'none';
    esconderMensagens();
});

document.getElementById('form_novo_flare_solar').addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderMensagens();

    const dateTime = document.getElementById('data_evento').value.trim();
    const classType = document.getElementById('classificacao_flare').value.trim();
    const description = document.getElementById('descricao_adicional').value.trim();
    const telescopes = obterTelescopiosSelecionados('dropdownContentTelescopiosNovo');

    if (!dateTime || !classType) {
        mensagemErro.textContent = 'Fill in the required fields.';
        mensagemErro.style.display = 'block';
        return;
    }

    const telescopesString = Array.isArray(telescopes) ? telescopes.join(';') : telescopes;

    try {
        await cadastrarFlare({
            dateTime,
            classType,
            description,
            telescopes: telescopesString
        });

        mensagemSucesso.textContent = 'Record added successfully.';
        exibirMensagensERecarregar(mensagemSucesso, modalNovoFlare);
    } catch (error) {
        mensagemErro.textContent = error.message;
        mensagemErro.style.display = 'block';
    }
});


function abrirModalEditar(id) {
    try {
        const data = buscarFlarePorIdLocal(id);
        idEditar = id;

        document.getElementById('editar_data_evento').value = data.dateTime || '';
        document.getElementById('editar_classificacao_flare').value = data.classType || '';
        document.getElementById('editar_descricao_adicional').value = data.description || '';

        const checkboxes = document.querySelectorAll('#dropdownContentTelescopiosEditar input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = (data.telescopes || '').includes(cb.value);
        });

        setModoVisualizacaoEditar(true);
        modalEditarFlare.style.display = 'flex';
        esconderMensagens();
    } catch (error) {
        mensagemErroEditar.textContent = error.message;
        mensagemErroEditar.style.display = 'block';
    }
}

btnAtivarEdicao.addEventListener('click', () => {
    setModoVisualizacaoEditar(false);
});

document.getElementById('cancelar_flare_editar').addEventListener('click', () => {
    modalEditarFlare.style.display = 'none';
    esconderMensagens();
});

document.getElementById('form_editar_evento').addEventListener('submit', async (e) => {
    e.preventDefault();
    esconderMensagens();

    const dateTime = document.getElementById('editar_data_evento').value.trim();
    const classType = document.getElementById('editar_classificacao_flare').value.trim();
    const description = document.getElementById('editar_descricao_adicional').value.trim();
    const telescopes = obterTelescopiosSelecionados('dropdownContentTelescopiosEditar');

    if (!dateTime || !classType) {
        mensagemErroEditar.textContent = 'Fill in the required fields.';
        mensagemErroEditar.style.display = 'block';
        return;
    }

    try {
        await atualizarFlare(idEditar, { dateTime, classType, description, telescopes });
        mensagemSucessoEditar.textContent = 'Updated successfully.';
        exibirMensagensERecarregar(mensagemSucessoEditar, modalEditarFlare);
    } catch (error) {
        mensagemErroEditar.textContent = error.message;
        mensagemErroEditar.style.display = 'block';
    }
});

function abrirModalExcluir(id) {
    idExcluir = id;
    modalExcluirFlare.style.display = 'flex';
    esconderMensagens();
}

document.querySelector('#modal_excluir_evento .btnGreen').addEventListener('click', async () => {
    try {
        await deletarFlare(idExcluir);
        mensagemSucessoExcluir.textContent = 'Deleted successfully.';
        exibirMensagensERecarregar(mensagemSucessoExcluir, modalExcluirFlare);

    } catch (error) {
        mensagemErroExcluir.textContent = error.message;
        mensagemErroExcluir.style.display = 'block';
    }
});

document.getElementById('excluir_evento').addEventListener('click', () => {
    modalExcluirFlare.style.display = 'none';
    esconderMensagens();
});


document.addEventListener('DOMContentLoaded', () => {
    carregarFlares();
    carregarTelescopios();
});
