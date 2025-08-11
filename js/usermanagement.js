const token = localStorage.getItem('token');

function bloquearBotao(botao) {
    if (botao) {
        botao.disabled = true;
        botao.classList.add('disabled');
    }
}

function liberarBotao(botao) {
    if (botao) {
        botao.disabled = false;
        botao.classList.remove('disabled');
    }
}

function exibirMensagemERecarregar(mensagemElemento, tempo = 1500) {
    mensagemElemento.style.display = 'block';
    setTimeout(() => {
        mensagemElemento.style.display = 'none';
        location.reload()
    }, tempo)
}

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    try {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    } catch (error) {
        return 'N/A';
    }
}

async function cadastrarUsuario(usuario) {
    const response = await fetch(`${BASE_URL}users`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usuario),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error in user registration');
    }

    return await response.json();
}

async function listarUsuarios() {
    const response = await fetch(`${BASE_URL}users`, {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    if (!response.ok) {
        throw new Error('Error fetching user');
    }
    return await response.json();
}

async function atualizarUsuario(emailOriginal, usuario) {

    const getUserResponse = await fetch(`${BASE_URL}users/${emailOriginal}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!getUserResponse.ok) {
        const data = await getUserResponse.json();
        throw new Error(data.message || 'Error fetching user before updating');
    }

    const usuarioExistente = await getUserResponse.json();

    const { password, ...restanteUsuario } = usuarioExistente;

    const usuarioParaAtualizar = {
        ...restanteUsuario,
        fullName: usuario.name,
        email: usuario.email,
        username: usuario.email,
        profileType: usuario.profileType,
        updatedAt: new Date().toISOString()
    };

    const response = await fetch(`${BASE_URL}users/${emailOriginal}`, {
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usuarioParaAtualizar),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error updating user');
    }

    return await response.json();
}

async function deletarUsuario(email) {
    const response = await fetch(`${BASE_URL}users/${email}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error deleting user');
    }
    return true;
}

async function atualizarSenha(email, novaSenha) {

    const response = await fetch(`${BASE_URL}users/update-password-admin`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            email: email,
            newPassword: novaSenha
        })
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao atualizar senha');
    }

    return await response.json();
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalAdicionarUsuario');
    const btnAbrirModal = document.getElementById('btn_adicionar');
    const btnCancelarModal = document.getElementById('cancelarModal');
    const formulario = document.getElementById('formAdicionarUsuario');

    const modalEditar = document.getElementById('modalEditarUsuario');
    const formEditar = document.getElementById('formEditarUsuario');
    const btnCancelarEditar = document.getElementById('cancelarEdicao');

    const modalAtualizarSenha = document.getElementById('modal_atualizar_senha');
    const formAtualizarSenha = document.getElementById('form_atualizar_senha');
    const inputEmailSenha = document.getElementById('confirm_email');
    const inputSenha = document.getElementById('atualizar_senha');
    const btnCancelarAtualizarSenha = document.getElementById('cancelar_atualizacao_senha');

    const modalExcluir = document.getElementById('modal_excluir');
    const infoUsuarioExcluir = document.getElementById('info_usuario_excluir');
    const btnConfirmarExclusao = document.getElementById('confirmar_exclusao_usuario');
    const btnCancelarExclusao = document.getElementById('cancelar_exclusao');

    const mensagemSucessoAtualizarSenha = document.getElementById('mensagem-sucesso-atualizar-senha');
    const mensagemErroAtualizarSenha = document.getElementById('mensagem-erro-atualizar-senha');

    const mensagemSucesso = document.getElementById('adicionado_sucesso');
    const mensagemErro = document.getElementById('erro_geral');

    const mensagemSucessoEdicao = document.getElementById('mensagem-sucesso-edicao');
    const mensagemErroEdicao = document.getElementById('mensagem-erro-edicao');

    const mensagemSucessoDeletar = document.getElementById('mensagem-sucesso-excluir');
    const mensagemErroDeletar = document.getElementById('mensagem-erro-excluir');

    const tbody = document.querySelector('tbody');

    let usuarioEditadoEmail = null;
    let emailParaExcluir = null;

    function esconderMensagens() {
        const mensagens = document.querySelectorAll('.valid_message_error, .invalid_message_error');
        mensagens.forEach(msg => {
            msg.style.display = 'none';
            msg.classList.add('esconder');
        });
    }

    const perfilTextoMap = {
        'ADMINISTRATOR': 'Administrator',
        'CRAAM_RESEARCHER': 'Craam Researcher',
        'SOLAR_PHYSICIST': 'Solar Physicist'
    };

    function perfilTotexto(perfil) {
        return perfilTextoMap[perfil] || perfil || 'Unknown';
    }

    async function carregarUsuarios() {
        try {
            const resposta = await listarUsuarios();
            
            usuariosOriginais = (Array.isArray(resposta.data) ? resposta.data : [resposta]).map(usuario => {
                usuario.deleted = usuario.deleted === true || usuario.isDelete === true;
                return usuario;
            });

            aplicarFiltros();
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            mensagemErro.textContent = error.message || 'Error loading users';
            mensagemErro.style.display = 'block';
        }
    }

    document.getElementById('btn_buscar').addEventListener('click', aplicarFiltros);

    document.getElementById('btn_limpar').addEventListener('click', () => {
        document.getElementById('filtroPorNome').value = '';
        document.getElementById('filtroPorEmail').value = '';
        document.getElementById('filtroPerfil').value = '';
        document.getElementById('filtroStatus').value = '';

        usuariosFiltrados = [...usuariosOriginais];
        paginaAtual = 1;
        displayPage(usuariosFiltrados, paginaAtual);
    });

    let usuariosOriginais = [];
    let usuariosFiltrados = []
    let paginaAtual = 1;
    const linhasPorPagina = 10;
    const paginacaoContainer = document.getElementById('paginacao_container');

    function aplicarFiltros() {

        const nomeFiltro = document.getElementById('filtroPorNome').value.trim().toLowerCase();
        const emailFiltro = document.getElementById('filtroPorEmail').value.trim().toLowerCase();
        const perfilSelecionado = document.getElementById('filtroPerfil').value;
        const statusSelecionado = document.getElementById('filtroStatus').value;

        usuariosFiltrados = usuariosOriginais.filter(usuario => {
            const nome = (usuario.name || usuario.fullName || '').toLowerCase();
            const email = (usuario.email || '').toLowerCase();
            const perfil = usuario.profile?.type || usuario.profileType || '';
            const isDeletado = !!usuario.deleted;

            return (
                (nomeFiltro === '' || nome.includes(nomeFiltro)) &&
                (emailFiltro === '' || email.includes(emailFiltro)) &&
                (perfilSelecionado === '' || perfil === perfilSelecionado) &&
                (statusSelecionado === '' ||
                    (statusSelecionado === 'ativo' && !isDeletado) ||
                    (statusSelecionado === 'deletado' && isDeletado))
            );
        });

        paginaAtual = 1;
        displayPage(usuariosFiltrados, paginaAtual);
    }

    function preencherTabela(usuarios) {
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No results found for the selected filters.</td></tr>';
            return;
        }

        usuarios.forEach((usuario) => {
            console.log('Processando usuário:', usuario); 
            
            const nome = usuario.name || usuario.fullName || usuario.username || 'N/A';
            const email = usuario.email || 'N/A';
            const perfil = perfilTotexto(usuario.profile?.type || usuario.profileType || 'N/A');
            const updatedBy = usuario.updatedBy || usuario.updated_by || 'N/A';
            const createdAt = formatarData(usuario.createdAt || usuario.created_at);
            const updatedAt = formatarData(usuario.updatedAt || usuario.updated_at);

            const isDadosIncompletos = nome === 'N/A' || email === 'N/A' || usuario.username == null;
            const isDeletado = usuario.deleted || isDadosIncompletos;

            const statusTexto = isDeletado ? 'Deleted' : 'Active';
            const statusClasse = isDeletado ? 'status deletado' : 'status ativo';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${nome}</td>
                <td>${email}</td>
                <td>${perfil}</td>
                <td><span class="${statusClasse}">${statusTexto}</span></td>
                <td>${updatedBy}</td>
                <td>${createdAt}</td>
                <td>${updatedAt}</td>
                <td class="acoes">
                    <div class="botoes_responsivo">
                        <button class="edit btnGray_table" data-email="${email}">Edit</button>
                        <button class="resetar_password btnGray_table" data-email="${email}">Reset Password</button>
                        <button class="deletar btnGray_table" data-email="${email}">Delete</button> 
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function abrirModalAtualizarSenha(email) {
        inputEmailSenha.value = email;
        inputSenha.value = '';
        esconderMensagens();
        mensagemErroAtualizarSenha.style.display = 'none';
        mensagemSucessoAtualizarSenha.style.display = 'none';
        modalAtualizarSenha.classList.remove('esconder');
    }

    btnAbrirModal.addEventListener('click', () => {
        modal.classList.remove('esconder');
        formulario.reset();
        esconderMensagens();
    });

    btnCancelarModal.addEventListener('click', () => {
        esconderMensagens();
        modal.classList.add('esconder');
        formulario.reset();
    });

    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();
        esconderMensagens();

        bloquearBotao(event.submitter);

        const nome = document.getElementById('nomeNovoUsuario').value.trim();
        const email = document.getElementById('emailNovoUsuario').value.trim();
        const perfilSelecionado = document.querySelector('input[name="perfilNovoUsuario"]:checked');

        const submitBtn = formulario.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        if (!nome || !email || !perfilSelecionado) {
            mensagemErro.textContent = 'Fill in all required fields.';
            mensagemErro.style.display = 'block';
            liberarBotao(event.submitter);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mensagemErro.textContent = 'Enter a valid email.';
            mensagemErro.style.display = 'block';
            return;
        }

        try {
            const usuariosResponse = await listarUsuarios();
            const usuarios = Array.isArray(usuariosResponse.data) ? usuariosResponse.data : usuariosResponse;

            const emailExiste = usuarios.some(u => (u.email || '').toLowerCase() === email.toLowerCase());

            if (emailExiste) {
                mensagemErro.textContent = 'User already exists';
                mensagemErro.style.display = 'block';
                liberarBotao(event.submitter);
                return;
            }

            await cadastrarUsuario({
                fullName: nome,
                email: email,
                profileType: perfilSelecionado.value,
            });

            mensagemSucesso.textContent = 'User has been successfully added. Credentials have been sent by email.';
            exibirMensagemERecarregar(mensagemSucesso)
        } catch (error) {
            mensagemErro.textContent = error.message || 'Error adding user';
            mensagemErro.style.display = 'block';
        } finally {
            liberarBotao(event.submitter);
        }
        setTimeout(() => {
            if (submitBtn) submitBtn.disabled = false;
        }, 2000);
    });

    btnCancelarEditar.addEventListener('click', () => {
        modalEditar.classList.add('esconder');
        formEditar.reset();
        esconderMensagens();
    });

    formEditar.addEventListener('submit', async (event) => {
        event.preventDefault();
        esconderMensagens();

        bloquearBotao(event.submitter);

        const nome = document.getElementById('nomeEditarUsuario').value.trim();
        const email = document.getElementById('emailEditarUsuario').value.trim();
        const perfilSelecionado = document.querySelector('input[name="perfilEditarUsuario"]:checked');

        const submitBtn = formEditar.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        if (!nome || !email || !perfilSelecionado) {
            mensagemErroEdicao.textContent = 'Fill in all required fields.';
            mensagemErroEdicao.style.display = 'block';
            liberarBotao(event.submitter);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        try {
            await atualizarUsuario(usuarioEditadoEmail, {
                name: nome,
                email: usuarioEditadoEmail,
                username: usuarioEditadoEmail,
                profileType: perfilSelecionado.value,
            });

            mensagemSucessoEdicao.style.display = 'block';
            exibirMensagemERecarregar(mensagemSucessoEdicao);
        } catch (error) {
            mensagemErroEdicao.textContent = error.message || 'Error updating user';
            mensagemErroEdicao.style.display = 'block';
        } finally {
            liberarBotao(event.submitter);
        }
        setTimeout(() => {
            if (submitBtn) submitBtn.disabled = false;
        }, 2000);
    });

    formAtualizarSenha.addEventListener('submit', async (event) => {
        event.preventDefault();
        esconderMensagens();

        bloquearBotao(event.submitter);

        const email = inputEmailSenha.value.trim();
        const novaSenha = inputSenha.value.trim();

        const submitBtn = formAtualizarSenha.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        if (!novaSenha) {
            mensagemErroAtualizarSenha.textContent = 'Fill in the new password.';
            mensagemErroAtualizarSenha.style.display = 'block';
            liberarBotao(event.submitter);
            if (submitBtn) submitBtn.disabled = false;
            return;
        }

        try {
            await atualizarSenha(email, novaSenha);

            mensagemSucessoAtualizarSenha.textContent = 'Password updated successfully.';
            exibirMensagemERecarregar(mensagemSucessoAtualizarSenha);
        } catch (error) {
            mensagemErroAtualizarSenha.textContent = error.message || 'Error updating password';
            mensagemErroAtualizarSenha.style.display = 'block';
        } finally {
            liberarBotao(event.submitter);
        }
        setTimeout(() => {
            if (submitBtn) submitBtn.disabled = false;
        }, 2000);
    });

    btnCancelarAtualizarSenha.addEventListener('click', () => {
        modalAtualizarSenha.classList.add('esconder');
        formAtualizarSenha.reset();
        esconderMensagens();
    });

    tbody.addEventListener('click', async (e) => {
        const email = e.target.dataset.email;
        if (!email) return;

        if (e.target.classList.contains('deletar')) {
            try {
                emailParaExcluir = email;
                infoUsuarioExcluir.textContent = `"${emailParaExcluir}" `;

                mensagemSucessoDeletar.style.display = 'none';
                mensagemSucessoDeletar.classList.add('esconder');

                mensagemErroDeletar.style.display = 'none';
                mensagemErroDeletar.classList.add('esconder');

                modalExcluir.classList.remove('esconder');
            } catch (error) {
                mensagemErroDeletar.textContent = error.message;
                mensagemErroDeletar.style.display = 'block';
                mensagemErroDeletar.classList.remove('esconder');
            }
        } else if (e.target.classList.contains('edit')) {
            const linha = e.target.closest('tr');
            const nome = linha.children[0].textContent;
            const perfilTexto = linha.children[2].textContent;

            usuarioEditadoEmail = email;

            document.getElementById('nomeEditarUsuario').value = nome;
            document.getElementById('emailEditarUsuario').value = email;

            const perfilMap = {
                'Administrator': 'ADMINISTRATOR',
                'Craam Researcher': 'CRAAM_RESEARCHER',
                'Solar Physicist': 'SOLAR_PHYSICIST'
            };

            const valorRadio = perfilMap[perfilTexto];
            if (valorRadio) {
                document.querySelector(`input[name="perfilEditarUsuario"][value="${valorRadio}"]`).checked = true;
            }

            modalEditar.classList.remove('esconder');
        } else if (e.target.classList.contains('resetar_password')) {
            abrirModalAtualizarSenha(email);
        }
    });

    btnConfirmarExclusao.addEventListener('click', async () => {

        bloquearBotao(btnConfirmarExclusao);
        bloquearBotao(btnCancelarExclusao);

        try {
            await deletarUsuario(emailParaExcluir);

            mensagemSucessoDeletar.textContent = 'User successfully deleted.';
            mensagemSucessoDeletar.style.display = 'block';
            mensagemErroDeletar.style.display = 'none';

            setTimeout(() => {
                mensagemSucessoDeletar.style.display = 'none';
                modalExcluir.classList.add('esconder');

                liberarBotao(btnConfirmarExclusao);
                liberarBotao(btnCancelarExclusao);

                location.reload();
            }, 3000);
        } catch (error) {
            mensagemErroDeletar.textContent = error.message || 'Error deleting user';
            mensagemErroDeletar.style.display = 'block';
            mensagemSucessoDeletar.style.display = 'none';

            liberarBotao(btnConfirmarExclusao);
            liberarBotao(btnCancelarExclusao);
        }
    });

    btnCancelarExclusao.addEventListener('click', () => {
        modalExcluir.classList.add('esconder');
    });

    carregarUsuarios();

    function displayPage(usuarios, pagina) {
        const comecar = (pagina - 1) * linhasPorPagina;
        const fim = comecar + linhasPorPagina;
        const usuariosPaginados = usuarios.slice(comecar, fim);

        preencherTabela(usuariosPaginados);
        renderizarPaginacao(usuarios.length, pagina)
    }

    function renderizarPaginacao(totalItems, paginaAtual) {
        paginacaoContainer.innerHTML = '';

        const totalDePaginas = Math.ceil(totalItems / linhasPorPagina);

        if (paginaAtual > 1) {
            const btnPrev = document.createElement('button');
            btnPrev.textContent = 'Previous';
            btnPrev.addEventListener('click', () => {
                displayPage(usuariosFiltrados, paginaAtual - 1);
            });
            paginacaoContainer.appendChild(btnPrev);
        }

        const maxInicio = Math.min(5, totalDePaginas);

        if (paginaAtual <= 5) {
            for (let i = 1; i <= maxInicio; i++) {
                const btn = criarBotaoPagina(i, paginaAtual);
                paginacaoContainer.appendChild(btn);
            }

            if (totalDePaginas > 5) {
                paginacaoContainer.appendChild(criarEllipsis());
                const btnUltima = criarBotaoPagina(totalDePaginas, paginaAtual);
                paginacaoContainer.appendChild(btnUltima);
            }
        } else {
            paginacaoContainer.appendChild(criarBotaoPagina(1, paginaAtual));
            paginacaoContainer.appendChild(criarEllipsis());

            let inicioJanela = paginaAtual - 1;
            let fimJanela = paginaAtual + 1;

            if (fimJanela > totalDePaginas - 1) {
                fimJanela = totalDePaginas - 1;
                inicioJanela = fimJanela - 2;
            }
            if (inicioJanela < 2) {
                inicioJanela = 2;
                fimJanela = inicioJanela + 2;
            }

            for (let i = inicioJanela; i <= fimJanela; i++) {
                const btn = criarBotaoPagina(i, paginaAtual);
                paginacaoContainer.appendChild(btn);
            }

            paginacaoContainer.appendChild(criarEllipsis());
            paginacaoContainer.appendChild(criarBotaoPagina(totalDePaginas, paginaAtual));
        }

        if (paginaAtual < totalDePaginas) {
            const btnNext = document.createElement('button');
            btnNext.textContent = 'Next';
            btnNext.addEventListener('click', () => {
                displayPage(usuariosFiltrados, paginaAtual + 1);
            });
            paginacaoContainer.appendChild(btnNext);
        }

        function criarBotaoPagina(numero, paginaAtual) {
            const btn = document.createElement('button');
            btn.textContent = numero;
            if (numero === paginaAtual) {
                btn.classList.add('active');
            }
            btn.addEventListener('click', () => {
                displayPage(usuariosFiltrados, numero);
            });
            return btn;
        }

        function criarEllipsis() {
            const span = document.createElement('span');
            span.textContent = '...';
            span.classList.add('ellipsis');
            return span;
        }
    }
});