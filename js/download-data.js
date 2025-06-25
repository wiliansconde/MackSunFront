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

    function atualizarEstadoLoginECheckboxes() {
        const tokenAutenticacaoUsuario = localStorage.getItem('token');
        let dadosInformacaoUsuario = null;
        try {
            const dadosInformacaoUsuarioRaw = sessionStorage.getItem('userInfo');
            dadosInformacaoUsuario = dadosInformacaoUsuarioRaw ? JSON.parse(dadosInformacaoUsuarioRaw) : null;
        } catch (erro) {
            console.error("Erro ao processar dados de informação do usuário do sessionStorage:", erro);
            dadosInformacaoUsuario = null;
        }

        const usuarioAutenticado = Boolean(tokenAutenticacaoUsuario && dadosInformacaoUsuario && dadosInformacaoUsuario.success && dadosInformacaoUsuario.data && dadosInformacaoUsuario.data.token);
        const tipoDePerfilDoUsuario = usuarioAutenticado ? dadosInformacaoUsuario.data.user.profile.type : 'VISITOR';

        if (!usuarioAutenticado) {
            document.body.classList.add('visitante');
            console.log("Usuário não autenticado: Classe 'visitante' adicionada ao body.");
        } else {
            document.body.classList.remove('visitante');
            console.log("Usuário autenticado: Classe 'visitante' removida do body.");
        }

        const todosCheckboxesResolucao = document.querySelectorAll('input[type="checkbox"]');
        todosCheckboxesResolucao.forEach(checkboxIndividual => {
            if (!usuarioAutenticado && checkboxIndividual.value !== '1s') {
                checkboxIndividual.disabled = true;
                checkboxIndividual.classList.add('desabilitado');
            } else {
                checkboxIndividual.disabled = false;
                checkboxIndividual.classList.remove('desabilitado');
            }
        });

        switch (tipoDePerfilDoUsuario) {
            case 'CRAAM_RESEARCHER':
            case 'ADMINISTRATOR':
                limiteDiasMaximoExportacaoPorPerfil = 9999;
                break;
            case 'SOLAR_PHYSICIST':
            case 'VISITOR':
            default:
                limiteDiasMaximoExportacaoPorPerfil = 7;
                break;
        }
        console.log(`Estado de login atualizado: Autenticado=${usuarioAutenticado}, Perfil=${tipoDePerfilDoUsuario}, Dias Máximos=${limiteDiasMaximoExportacaoPorPerfil}`);
    }

    atualizarEstadoLoginECheckboxes();

    document.addEventListener('loginSuccess', () => {
        console.log('Evento "loginSuccess" recebido. Reavaliando o estado de login e checkboxes.');
        atualizarEstadoLoginECheckboxes();
    });

    document.addEventListener('logoutSuccess', () => {
        console.log('Evento "logoutSuccess" recebido. Reavaliando o estado de login e checkboxes.');
        atualizarEstadoLoginECheckboxes(); // Reavalia o estado após o logout
    });

    function esconderTodasMensagensErro() {
        mensagemErroCamposVazios.style.display = 'none';
        mensagemErroResolucaoTelescopio.style.display = 'none';
        mensagemErroPeriodoDataVazio.style.display = 'none';
        mensagemErroPeriodoMaximo.style.display = 'none';
        mensagemErroPeriodoMaximo.textContent = '';
        mensagemErroFormatoVazio.style.display = 'none';
        elementoDivResultadoExportacao.style.display = 'none';
        elementoDivResultadoExportacao.classList.remove('resultado_sucesso', 'resultado_erro');
    }

    function validarDadosFormulario(dadosDoFormulario) {
        esconderTodasMensagensErro();

        const existeResolucaoSelecionada = Object.values(dadosDoFormulario.selectedResolutionsByChannel).some(canais =>
            Object.values(canais).some(resolucoes => resolucoes.length > 0)
        );

        if (dadosDoFormulario.selectedInstruments.length === 0 || !existeResolucaoSelecionada) {
            mensagemErroResolucaoTelescopio.style.display = 'block';
            mensagemErroResolucaoTelescopio.textContent = 'Please refer to at least one telescope resolution';
            return false;
        }

        if (!dadosDoFormulario.startDate || !dadosDoFormulario.endDate) {
            mensagemErroPeriodoDataVazio.style.display = 'block';
            return false;
        }

        const dataInicioObj = new Date(dadosDoFormulario.startDate);
        const dataFimObj = new Date(dadosDoFormulario.endDate);
        const diferencaEmMilisegundos = Math.abs(dataFimObj - dataInicioObj);
        const diferencaEmDias = Math.ceil(diferencaEmMilisegundos / (1000 * 60 * 60 * 24));

        if (limiteDiasMaximoExportacaoPorPerfil !== 9999 && diferencaEmDias > limiteDiasMaximoExportacaoPorPerfil) {
            mensagemErroPeriodoMaximo.style.display = 'block';
            mensagemErroPeriodoMaximo.textContent = `The maximum period allowed for export is ${limiteDiasMaximoExportacaoPorPerfil} days.`;
            return false;
        }

        if (dadosDoFormulario.outputFormats.length === 0) {
            mensagemErroFormatoVazio.style.display = 'block';
            return false;
        }

        return true;
    }

    elementoFormularioDownload.addEventListener('submit', async (evento) => {
        evento.preventDefault();
        esconderTodasMensagensErro();

        const conjuntoInstrumentosSelecionados = new Set();
        const objetoResolucoesSelecionadasPorCanal = {
            POEMAS: { poemas_45: [], poemas_90: [] },
            SST: { sst_212: [], sst_405: [] },
            "H-ALPHA": { "h-alpha_Custom": [] },
            "7GHZ": { "7ghz_Custom": [] },
            "RADYN": { "radyn_Custom": [] }
        };

        document.querySelectorAll('.telescopios-container input[type="checkbox"]:checked').forEach(checkboxMarcado => {
            const partesDoId = checkboxMarcado.id.split('_');
            const prefixoDoInstrumento = partesDoId[0];
            const parteDoCanal = partesDoId.slice(1, partesDoId.length - 1).join('_');
            const nomeDoInstrumentoEmMaiusculas = prefixoDoInstrumento.toUpperCase();
            const chaveDoCanalFormatada = `${prefixoDoInstrumento}_${parteDoCanal}`;

            if (!objetoResolucoesSelecionadasPorCanal[nomeDoInstrumentoEmMaiusculas]) {
                objetoResolucoesSelecionadasPorCanal[nomeDoInstrumentoEmMaiusculas] = {};
            }
            if (!objetoResolucoesSelecionadasPorCanal[nomeDoInstrumentoEmMaiusculas][chaveDoCanalFormatada]) {
                objetoResolucoesSelecionadasPorCanal[nomeDoInstrumentoEmMaiusculas][chaveDoCanalFormatada] = [];
            }

            conjuntoInstrumentosSelecionados.add(nomeDoInstrumentoEmMaiusculas);
            objetoResolucoesSelecionadasPorCanal[nomeDoInstrumentoEmMaiusculas][chaveDoCanalFormatada].push(checkboxMarcado.value.toUpperCase());
        });

        const valorDataInicial = campoDataInicial.value;
        const valorDataFinal = campoDataFinal.value;
        const valoresFormatosSaida = Array.from(seletoresFormatoSaida)
            .filter(radio => radio.checked)
            .map(radio => radio.value.toUpperCase());

        const corpoDaRequisicao = {
            selectedInstruments: Array.from(conjuntoInstrumentosSelecionados),
            selectedResolutionsByChannel: objetoResolucoesSelecionadasPorCanal,
            startDate: valorDataInicial,
            endDate: valorDataFinal,
            outputFormats: valoresFormatosSaida
        };

        if (!validarDadosFormulario(corpoDaRequisicao)) {
            return;
        }

        botaoEnviarExportacao.disabled = true;
        botaoEnviarExportacao.textContent = 'Exporting...';
        elementoDivResultadoExportacao.innerHTML = `
            <h3>Processing your request...</h3>
            <p>Please wait while your data is being prepared for download..</p>`;
        elementoDivResultadoExportacao.style.display = 'block';

        try {
            const cabecalhosRequisicao = { 'Content-Type': 'application/json' };
            const tokenAtualDoLocalStorage = localStorage.getItem('token');
            if (tokenAtualDoLocalStorage) {
                cabecalhosRequisicao['Authorization'] = `Bearer ${tokenAtualDoLocalStorage}`;
            }

            const respostaDaAPI = await fetch(`${BASE_URL}public/time-series/search`, {
                method: 'POST',
                headers: cabecalhosRequisicao,
                body: JSON.stringify(corpoDaRequisicao)
            });

            if (respostaDaAPI.ok) {
                const dadosRecebidosDaAPI = await respostaDaAPI.json();
                elementoDivResultadoExportacao.innerHTML = `
                    <h3>Resultado:</h3>
                    <p>${dadosRecebidosDaAPI.message || 'Export request sent successfully.'}</p>
                    <p>Estimated lines: ${dadosRecebidosDaAPI.data?.estimatedRowCount || 'N/A'}</p>
                    <p>Estimated processing time: ${dadosRecebidosDaAPI.data?.estimatedProcessingTime || 'N/A'}</p>
                `;
                elementoDivResultadoExportacao.classList.add('resultado_sucesso');
            } else {
                const dadosErroDaAPI = await respostaDaAPI.json();
                elementoDivResultadoExportacao.innerHTML = `
                    <h3>Error:</h3>
                    <p>${dadosErroDaAPI.message || 'Export failed.'}</p>`;
                elementoDivResultadoExportacao.classList.add('resultado_erro');
            }
        } catch (erroNaRequisicao) {
            console.error('Erro na exportação:', erroNaRequisicao);
            elementoDivResultadoExportacao.innerHTML = `
                <h3>Failure:</h3>
                <p>Network error or server unavailable.</p>`;
            elementoDivResultadoExportacao.classList.add('resultado_erro');
        } finally {
            botaoEnviarExportacao.disabled = false;
            botaoEnviarExportacao.textContent = 'Exportar';
            elementoDivResultadoExportacao.style.display = 'block';
        }
    });
});