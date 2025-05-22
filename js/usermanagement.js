const token = localStorage.getItem('token');

async function cadastrarUsuario(usuario) {
    console.log('Enviado novo usuário', usuario)
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
    console.log('Buscando lista de usuarios')
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
    console.log('Atualizando usuário', usuario)
    const response = await fetch(`${BASE_URL}users/${emailOriginal}`, {
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            fullName: usuario.name,
            email: usuario.email,
            profileType: usuario.profileType
        }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error in updating user');
    }
    return await response.json();
}

async function deletarUsuario(email) {
    console.log(`Deletando usuário com email ${email}`)
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

async function reativarUsuario(email) {
    console.log(`Reactivando usuário com email ${email}`);
    const getUserResponse = await fetch(`${BASE_URL}users/${email}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!getUserResponse.ok) {
        const data = await getUserResponse.json();
        throw new Error(data.message || 'Error retrieving user for reactivation.')
    }

    const usuario = await getUserResponse.json();

    const reativarResponse = await fetch(`${BASE_URL}users/${email}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            ...usuario,
            deleted: false,
            active: true
        })
    });

    if (!reativarResponse.ok) {
        const data = await reativarResponse.json();
        throw new Error(data.message || "Error reactivating user.")
    }
    return true;
}

async function reiniciarSenha(email) {
    console.log(`Reiniciando senha para ${email}`);

    const getUserResponse = await fetch(`${BASE_URL}users/${email}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!getUserResponse.ok) {
        const data = await getUserResponse.json();
        throw new Error(data.message || 'Failed to retrieve user for password reset');
    }

    const usuario = await getUserResponse.json();

    const updateUser = {
        ...usuario,
        resetPasswordRequested: true, // Certifique-se que o back-end usa isso
        updatedAt: new Date().toISOString() // se for necessário
    };

    const response = await fetch(`${BASE_URL}users/${email}`, {
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateUser),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error resetting password');
    }

    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('modalAdicionarUsuario');
    const btnAbrirModal = document.getElementById('btn_adicionar');
    const btnCancelarModal = document.getElementById('cancelarModal');
    const formulario = document.getElementById('formAdicionarUsuario');

    const modalEditar = document.getElementById('modalEditarUsuario');
    const formEditar = document.getElementById('formEditarUsuario');
    const btnCancelarEditar = document.getElementById('cancelarEdicao');

    const mensagemSucesso = document.getElementById('adicionado_sucesso');
    const mensagemErro = document.getElementById('erro_geral');

    const mensagemSucessoEdicao = document.getElementById('mensagem-sucesso-edicao');
    const mensagemErroEdicao = document.getElementById('mensagem-erro-edicao');

    const mensagemSucessoDeletar = document.getElementById('mensagem-sucesso-deletar');
    const mensagemErroDeletar = document.getElementById('mensagem-erro-deletar');

    const mensagemSucessoReativar = document.getElementById('mensagem-sucesso-reativar');
    const mensagemErroReativar = document.getElementById('mensagem-erro-reativar');

    const mensagemSucessoResetar = document.getElementById('mensagem-sucesso-resetar');
    const mensagemErroResetar = document.getElementById('mensagem-erro-resetar');

    const tbody = document.querySelector('tbody');

    let usuarioEditadoEmail = null;

    function esconderMensagens() {
        const mensagens = document.querySelectorAll('.valid_message_error, .invalid_message_error');
        mensagens.forEach(msg => msg.style.display = 'none');
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
        console.log('Carregando usuários...');
        try {
            const usuarios = await listarUsuarios();

            usuariosOriginais = (Array.isArray(usuarios.data) ? usuarios.data : usuarios).map(usuario => {
                const nome = (usuario.name || usuario.fullName || '').trim();
                const email = (usuario.email || '').trim();

                const nomeInvalido = !nome || nome.toUpperCase() === 'N/A';
                const emailInvalido = !email || email.toUpperCase() === 'N/A';

                if (nomeInvalido || emailInvalido) {
                    usuario.deleted = true;
                }

                return usuario;
            });

            aplicarFiltros();
        } catch (error) {
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
            const perfil = usuario.profile?.type ?? '';
            const status = usuario.deleted ? 'deletado' : 'ativo';

            return (
                (nomeFiltro === '' || nome.includes(nomeFiltro)) &&
                (emailFiltro === '' || email.includes(emailFiltro)) &&
                (perfilSelecionado === '' || perfil === perfilSelecionado) &&
                (statusSelecionado === '' || status === statusSelecionado)
            );
        });

        paginaAtual = 1;
        displayPage(usuariosFiltrados, paginaAtual);
    }

    function preencherTabela(usuarios) {
        console.log('Preenchendo tabela com usuários', usuarios)
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">User not found.</td></tr>';
            return;
        }

        usuarios.forEach((usuario) => {
            const nome = usuario.name || usuario.fullName || 'N/A';
            const email = usuario.email || 'N/A';
            const perfil = perfilTotexto(usuario.profile?.type || 'N/A');

            const isDadosIncompletos = nome === 'N/A' || email === 'N/A';
            const isDeletado = usuario.deleted || isDadosIncompletos;

            const statusTexto = isDeletado ? 'Deleted' : 'Active';
            const statusClasse = isDeletado ? 'status deletado' : 'status ativo';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${nome}</td>
                <td>${email}</td>
                <td>${perfil}</td>
                <td><span class="${statusClasse}">${statusTexto}</span></td>
                <td class="acoes">
                    <button class="edit btnGray_table" data-email="${email}">Edit</button>
                    <button class="resetar_password btnGray_table" data-email="${email}">Reset Password</button>
                    ${isDeletado
                    ? `<button class="reativar btnGray_table" data-email="${email}">Reactivate</button>`
                    : `<button class="deletar btnGray_table" data-email="${email}">Delete</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
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

        const nome = document.getElementById('nomeNovoUsuario').value.trim();
        const email = document.getElementById('emailNovoUsuario').value.trim();
        const perfilSelecionado = document.querySelector('input[name="perfilNovoUsuario"]:checked');

        if (!nome || !email || !perfilSelecionado) {
            mensagemErro.textContent = 'Fill in all required fields.';
            mensagemErro.style.display = 'block';
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mensagemErro.textContent = 'Enter a valid email.';
            mensagemErro.style.display = 'block';
            return;
        }

        try {
            await cadastrarUsuario({
                username: email,
                fullName: nome,
                email: email,
                profileType: perfilSelecionado.value
            });

            mensagemSucesso.textContent = 'User has been successfully added. Credentials have been sent by email.';
            mensagemSucesso.style.display = 'block';
            formulario.reset();
            await carregarUsuarios();
        } catch (error) {
            mensagemErro.textContent = error.message || 'Error adding user';
            mensagemErro.style.display = 'block';
        }
    });

    btnCancelarEditar.addEventListener('click', () => {
        modalEditar.classList.add('esconder');
        formEditar.reset();
        esconderMensagens();
    });

    formEditar.addEventListener('submit', async (event) => {
        event.preventDefault();
        esconderMensagens();

        const nome = document.getElementById('nomeEditarUsuario').value.trim();
        const email = document.getElementById('emailEditarUsuario').value.trim();
        const perfilSelecionado = document.querySelector('input[name="perfilEditarUsuario"]:checked');

        if (!nome || !email || !perfilSelecionado) {
            mensagemErroEdicao.textContent = 'Fill in all required fields.';
            mensagemErroEdicao.style.display = 'block';
            return;
        }

        try {
            await atualizarUsuario(usuarioEditadoEmail, {
                name: nome,
                email: email,
                profileType: perfilSelecionado.value,
            });

            mensagemSucessoEdicao.style.display = 'block';
            formEditar.reset();
            modalEditar.classList.add('esconder');
            await carregarUsuarios();
        } catch (error) {
            mensagemErroEdicao.textContent = error.message || 'Error updating user';
            mensagemErroEdicao.style.display = 'block';
        }
    });

    tbody.addEventListener('click', async (e) => {
        const email = e.target.dataset.email;
        if (!email) return;

        if (e.target.classList.contains('deletar')) {
            try {
                await deletarUsuario(email);
                await carregarUsuarios();
                mensagemSucessoDeletar.style.display = 'block';
            } catch (error) {
                mensagemErroDeletar.textContent = error.message;
                mensagemErroDeletar.style.display = 'block';
            }
        } else if (e.target.classList.contains('reativar')) {
            try {
                await reativarUsuario(email);
                await carregarUsuarios();
                mensagemSucessoReativar.style.display = 'block';
            } catch (error) {
                mensagemErroReativar.textContent = error.message;
                mensagemErroReativar.style.display = 'block';
            }
        } else if (e.target.classList.contains('resetar_password')) {
            try {
                await reiniciarSenha(email);
                mensagemSucessoResetar.style.display = 'block';
            } catch (error) {
                mensagemErroResetar.textContent = error.message;
                mensagemErroResetar.style.display = 'block';
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
        }
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

        for (let i = 1; i <= totalDePaginas; i++) {
            const btn_paginacao = document.createElement('button');
            btn_paginacao.textContent = i;

            if (i === paginaAtual) {
                btn_paginacao.classList.add('active');
            }

            btn_paginacao.addEventListener('click', () => {
                paginaAtual = i;
                displayPage(usuariosFiltrados, i);
            });

            paginacaoContainer.appendChild(btn_paginacao);
        }
    }

});
