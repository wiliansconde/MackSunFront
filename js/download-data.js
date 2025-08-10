let arquivosDisponiveisParaDownload = [];
let totalArquivosDisponiveisNaBusca = 0;

document.addEventListener('DOMContentLoaded', () => {
    const elementoFormularioDownload = document.querySelector('.formulario_downloadData');
    const campoDataInicial = document.getElementById('startDate');
    const campoDataFinal = document.getElementById('endDate');
    const seletoresFormatoSaida = document.querySelectorAll('input[name="exportFormat"]');
    const botaoEnviarExportacao = elementoFormularioDownload.querySelector('button[type="submit"]');

    const mensagemErroCamposVazios = document.getElementById('campo-vazio');
    const mensagemErroResolucaoTelescopio = document.getElementById('campo-de-telescopio-vazio');
    const mensagemErroPeriodoDataVazio = document.getElementById('campo-de-periodo-vazio');
    const mensagemErroPeriodoMaximo = document.getElementById('campo-de-periodo-maximo');
    const mensagemErroFormatoVazio = document.getElementById('campo-de-formato-vazio');
    const elementoDivResultadoExportacao = document.getElementById('resultado_exportacao');

    let limiteDiasMaximoExportacaoPorPerfil;
    let paginaAtual = 0;
    let totalPaginas = 0;
    let itensPorPaginaSelecionado = 10;

    function atualizarEstadoLoginECheckboxes() {
        const tokenAutenticacaoUsuario = localStorage.getItem('token');
        let dadosInformacaoUsuario = null;
        try {
            const dadosInformacaoUsuarioRaw = sessionStorage.getItem('userInfo');
            dadosInformacaoUsuario = dadosInformacaoUsuarioRaw ? JSON.parse(dadosInformacaoUsuarioRaw) : null;
        } catch (erro) {
            console.error("Erro ao processar dados de informação do usuário:", erro);
            dadosInformacaoUsuario = null;
        }

        const usuarioAutenticado = Boolean(
            tokenAutenticacaoUsuario &&
            dadosInformacaoUsuario &&
            dadosInformacaoUsuario.success &&
            dadosInformacaoUsuario.data &&
            dadosInformacaoUsuario.data.token
        );

        const tipoDePerfilDoUsuario = usuarioAutenticado
            ? dadosInformacaoUsuario?.data?.user?.profile?.type || 'VISITOR'
            : 'VISITOR';

        document.body.classList.toggle('visitante', !usuarioAutenticado);

        const permissoesSolarPhysicist = new Set([
            'poemas_45_100ms',
            'poemas_45_1s',
            'sst_212_100ms',
            'sst_212_1s'
        ]);

        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            const idCompleto = cb.id;

            const deveDesabilitar =
                (!usuarioAutenticado && cb.value !== '1s') ||
                (tipoDePerfilDoUsuario === 'SOLAR_PHYSICIST' && !permissoesSolarPhysicist.has(idCompleto));

            cb.disabled = deveDesabilitar;
            cb.classList.toggle('desabilitado', deveDesabilitar);

            if (deveDesabilitar) {
                cb.closest('label')?.setAttribute('title', 'To enable this filter, please request access or a profile upgrade.');
            } else {
                cb.closest('label')?.removeAttribute('title');
            }
        });

        switch (tipoDePerfilDoUsuario) {
            case 'ADMINISTRATOR':
                limiteDiasMaximoExportacaoPorPerfil = 9999;
                break;
            case 'CRAAM_RESEARCHER':
                limiteDiasMaximoExportacaoPorPerfil = 3;
                break;
            case 'SOLAR_PHYSICIST':
            case 'VISITOR':
            default:
                limiteDiasMaximoExportacaoPorPerfil = 2;
                break;
        }
    }

    atualizarEstadoLoginECheckboxes();
    document.addEventListener('loginSuccess', atualizarEstadoLoginECheckboxes);
    document.addEventListener('logoutSuccess', atualizarEstadoLoginECheckboxes);

    const selectItensPorPagina = document.getElementById('itensPorPagina');
    selectItensPorPagina.addEventListener('change', () => {
        const valor = selectItensPorPagina.value;
        itensPorPaginaSelecionado = parseInt(valor);
        paginaAtual = 0;
        elementoFormularioDownload.dispatchEvent(new Event('submit'));
    });

    function esconderTodasMensagensErro() {
        [mensagemErroCamposVazios, mensagemErroResolucaoTelescopio, mensagemErroPeriodoDataVazio, mensagemErroPeriodoMaximo, mensagemErroFormatoVazio].forEach(msg => {
            msg.style.display = 'none';
        });
        elementoDivResultadoExportacao.style.display = 'none';
        elementoDivResultadoExportacao.classList.remove('resultado_sucesso', 'resultado_erro');
    }

    function validarDadosFormulario(dados) {
        esconderTodasMensagensErro();

        const existeResolucao = Object.values(dados.resolutionsByInstrument).some(arr => arr.length > 0);

        if (dados.instruments.length === 0 || !existeResolucao) {
            mensagemErroResolucaoTelescopio.style.display = 'block';
            mensagemErroResolucaoTelescopio.textContent = 'Please refer to at least one telescope resolution';
            return false;
        }

        if (!dados.startDate || !dados.endDate) {
            mensagemErroPeriodoDataVazio.style.display = 'block';
            return false;
        }

        const dataInicioObj = new Date(dados.startDate);
        const dataFimObj = new Date(dados.endDate);
        if (dataInicioObj > dataFimObj) {
            mensagemErroPeriodoDataVazio.style.display = 'block';
            mensagemErroPeriodoDataVazio.textContent = 'Start date must be before end date.';
            return false;
        }

        const diferencaEmDias = Math.ceil((dataFimObj - dataInicioObj) / (1000 * 60 * 60 * 24));
        if (limiteDiasMaximoExportacaoPorPerfil !== 9999 && diferencaEmDias > limiteDiasMaximoExportacaoPorPerfil) {
            mensagemErroPeriodoMaximo.style.display = 'block';
            mensagemErroPeriodoMaximo.textContent = `The maximum period allowed for export is ${limiteDiasMaximoExportacaoPorPerfil} days.`;
            return false;
        }

        if (dados.formats.length === 0) {
            mensagemErroFormatoVazio.style.display = 'block';
            return false;
        }

        return true;
    }

    elementoFormularioDownload.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        esconderTodasMensagensErro();

        const semResultadosDiv = document.getElementById('sem-resultados');
        semResultadosDiv.style.display = 'none';
        semResultadosDiv.innerHTML = '';
        semResultadosDiv.classList.remove('resultado_erro');

        const conjuntoInstrumentosSelecionados = new Set();
        const resolucoesPorCanal = {};

        document.querySelectorAll('.telescopios-container input[type="checkbox"]:checked').forEach(cb => {
            const partes = cb.id.split('_');
            if (partes.length < 3) return;

            const instrumento = partes[0].toUpperCase();
            const canalKey = `${partes[0]}_${partes[1]}`;
            const frequencia = cb.value.toUpperCase();

            conjuntoInstrumentosSelecionados.add(instrumento);

            if (!resolucoesPorCanal[instrumento]) {
                resolucoesPorCanal[instrumento] = {};
            }
            if (!resolucoesPorCanal[instrumento][canalKey]) {
                resolucoesPorCanal[instrumento][canalKey] = [];
            }

            resolucoesPorCanal[instrumento][canalKey].push(frequencia);
        });

        const startDate = campoDataInicial.value;
        const endDate = campoDataFinal.value;
        const formats = Array.from(seletoresFormatoSaida).filter(r => r.checked).map(r => r.value.toUpperCase());

        const instruments = Array.from(conjuntoInstrumentosSelecionados);
        const resolutionByInstrument = {};
        Object.entries(resolucoesPorCanal).forEach(([instr, canais]) => {
            const lista = [];
            Object.entries(canais).forEach(([canal, arr]) => {
                lista.push(...arr.map(r => `${instr.toLowerCase()}_${r.toLowerCase()}`));
            });
            if (lista.length) resolutionByInstrument[instr] = lista;
        });

        const corpoDaRequisicao = {
            instruments,
            resolutionsByInstrument: resolutionByInstrument,
            startDate,
            endDate,
            formats,
            page: paginaAtual,
            size: itensPorPaginaSelecionado
        };

        ultimaBuscaRealizada = { ...corpoDaRequisicao };

        if (!validarDadosFormulario(corpoDaRequisicao)) return;

        botaoEnviarExportacao.disabled = true;
        botaoEnviarExportacao.textContent = 'Loading...';
        elementoDivResultadoExportacao.style.display = 'block';
        elementoDivResultadoExportacao.innerHTML = `
                        <h3>Processing your request...</h3>
                        <p>Please wait while your data is being prepared for download..</p>`;
        setTimeout(() => {
            if (elementoDivResultadoExportacao.innerText.includes('Processing')) {
                elementoDivResultadoExportacao.style.display = 'none';
                elementoDivResultadoExportacao.innerHTML = '';
            }
        }, 3000);

        try {
            const headers = { 'Content-Type': 'application/json' };
            const tokenAtual = localStorage.getItem('token');
            if (tokenAtual) headers['Authorization'] = `Bearer ${tokenAtual}`;

            const resposta = await fetch(`${BASE_URL}public/search-files`, {
                method: 'POST',
                headers,
                body: JSON.stringify(corpoDaRequisicao)
            });

            const dadosRecebidos = await resposta.json();
            if (resposta.ok) {
                const dados = dadosRecebidos.data;
                const semResultadosDiv = document.getElementById('sem-resultados');
                const tbody = document.getElementById('tbody_resultados');
                semResultadosDiv.style.display = 'none';
                semResultadosDiv.innerHTML = '';
                semResultadosDiv.classList.remove('resultado_erro');

                arquivosDisponiveisParaDownload = dados.content || [];
                totalArquivosDisponiveisNaBusca = dados.totalElements || 0;

                if (dados.empty || dados.content.length === 0) {
                    document.querySelector('.container-tabela').classList.add('oculto');
                    document.querySelector('.controle-tabela').classList.add('oculto');
                    document.querySelector('.select-itens-pagina').classList.add('oculto');
                    document.getElementById('btn_download_all').classList.add('oculto');

                    tbody.innerHTML = '';
                    semResultadosDiv.style.display = 'block';
                    semResultadosDiv.innerHTML = `<h3>No results found for the selected filters.</h3>`;
                    semResultadosDiv.classList.add('resultado_erro');
                    return;
                }

                totalPaginas = dados.totalPages || 1;
                tbody.innerHTML = '';
                arquivosDisponiveisParaDownload = dados.content;
                dados.content.forEach(item => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${item.date}</td>
                        <td>${item.instrument}</td>
                        <td>${item.resolution}</td>
                        <td>${item.format}</td>
                        <td class='alinhar_downloadFile'><a href="${item.publicUrl}" target="_blank" download>Download file</a></td>`;
                    tbody.appendChild(tr);
                });

                document.querySelector('.container-tabela').classList.remove('oculto');
                document.querySelector('.container-tabela').style.display = 'block';
                document.querySelector('.controle-tabela').classList.remove('oculto');
                document.querySelector('.select-itens-pagina').classList.remove('oculto');
                document.getElementById('btn_download_all').classList.remove('oculto');
                document.getElementById('btn_download_all').disabled = false;

                renderizarPaginacao();

                elementoDivResultadoExportacao.innerHTML = `<h3>${dadosRecebidos.message}</h3>`;
                elementoDivResultadoExportacao.classList.add('resultado_sucesso');

                setTimeout(() => {
                    elementoDivResultadoExportacao.style.display = 'none';
                    elementoDivResultadoExportacao.innerHTML = '';
                    elementoDivResultadoExportacao.classList.remove('resultado_sucesso');
                }, 5000);
            } else {
                elementoDivResultadoExportacao.innerHTML = `<h3>Error:</h3><p>${dadosRecebidos.message || 'Loading failed.'}</p>`;
                elementoDivResultadoExportacao.classList.add('resultado_erro');

                setTimeout(() => {
                    elementoDivResultadoExportacao.style.display = 'none';
                    elementoDivResultadoExportacao.innerHTML = '';
                    elementoDivResultadoExportacao.classList.remove('resultado_erro');
                }, 5000);
            }
        } catch (erroNaRequisicao) {
            elementoDivResultadoExportacao.innerHTML = `<h3>Failure:</h3><p>Network error or server unavailable.</p>`;
            elementoDivResultadoExportacao.classList.add('resultado_erro');

            setTimeout(() => {
                elementoDivResultadoExportacao.style.display = 'none';
                elementoDivResultadoExportacao.innerHTML = '';
                elementoDivResultadoExportacao.classList.remove('resultado_erro');
            }, 5000);
        } finally {
            botaoEnviarExportacao.disabled = false;
            botaoEnviarExportacao.textContent = 'Search';
            elementoDivResultadoExportacao.style.display = 'block';
        }
    });

    function renderizarPaginacao() {
        const container = document.getElementById('container-paginacao');
        container.innerHTML = '';

        const total = totalPaginas;
        const atual = paginaAtual;

        if (atual > 0) {
            const btnAnterior = document.createElement('button');
            btnAnterior.textContent = 'Previous';
            btnAnterior.onclick = () => {
                paginaAtual--;
                elementoFormularioDownload.dispatchEvent(new Event('submit'));
            };
            container.appendChild(btnAnterior);
        }

        function criarBotaoPagina(num) {
            const btn = document.createElement('button');
            btn.textContent = (num + 1).toString();
            btn.classList.toggle('active', num === atual);
            btn.onclick = () => {
                paginaAtual = num;
                elementoFormularioDownload.dispatchEvent(new Event('submit'));
            };
            return btn;
        }

        container.appendChild(criarBotaoPagina(0));

        if (total <= 7) {
            for (let i = 1; i < total; i++) {
                container.appendChild(criarBotaoPagina(i));
            }
        } else {
            if (atual < 5) {
                for (let i = 1; i <= 4; i++) {
                    container.appendChild(criarBotaoPagina(i));
                }
                container.appendChild(criarEllipsis());
                container.appendChild(criarBotaoPagina(total - 1));
            } else if (atual > total - 5) {
                container.appendChild(criarEllipsis());
                for (let i = total - 5; i < total; i++) {
                    container.appendChild(criarBotaoPagina(i));
                }
            } else {
                container.appendChild(criarEllipsis());
                container.appendChild(criarBotaoPagina(atual - 1));
                container.appendChild(criarBotaoPagina(atual));
                container.appendChild(criarBotaoPagina(atual + 1));
                container.appendChild(criarEllipsis());
                container.appendChild(criarBotaoPagina(total - 1));
            }
        }

        if (atual < total - 1) {
            const btnProxima = document.createElement('button');
            btnProxima.textContent = 'Next';
            btnProxima.onclick = () => {
                paginaAtual++;
                elementoFormularioDownload.dispatchEvent(new Event('submit'));
            };
            container.appendChild(btnProxima);
        }

        function criarEllipsis() {
            const span = document.createElement('span');
            span.textContent = '...';
            span.classList.add('ellipsis');
            span.style.margin = '0 5px';
            return span;
        }
    }

    const botaoDownloadAll = document.getElementById('btn_download_all');
    const modalConfirmacao = document.getElementById('modal_confirmacao_download');
    const botaoConfirmar = document.getElementById('btn_confirmar_download');
    const botaoCancelar = document.getElementById('btn_cancelar_download');

    botaoDownloadAll.addEventListener('click', async () => {
        if (arquivosDisponiveisParaDownload.length === 0) return;

        const textoModal = modalConfirmacao.querySelector('p');
        textoModal.textContent = `Are you sure you want to download ${totalArquivosDisponiveisNaBusca} files?`;

        modalConfirmacao.classList.remove('oculto');
    });

    botaoCancelar.addEventListener('click', () => {
        modalConfirmacao.classList.add('oculto');
    });

    botaoConfirmar.addEventListener('click', async () => {
        modalConfirmacao.classList.add('oculto');

        const corpoBuscaCompleta = {
            ...ultimaBuscaRealizada,
            page: 0,
            size: 9999
        };

        try {
            const headers = { 'Content-Type': 'application/json' };
            const tokenAtual = localStorage.getItem('token');
            if (tokenAtual) headers['Authorization'] = `Bearer ${tokenAtual}`;

            const resposta = await fetch(`${BASE_URL}public/search-files`, {
                method: 'POST',
                headers,
                body: JSON.stringify(corpoBuscaCompleta)
            });

            const resultado = await resposta.json();
            const todosArquivos = resultado?.data?.content || [];

            todosArquivos.forEach((arquivo, index) => {
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.href = arquivo.publicUrl;
                    link.setAttribute('download', '');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }, index * 5000);
            });

        } catch (erro) {
            console.error("Erro ao buscar todos os arquivos:", erro);
        }
    });
});
