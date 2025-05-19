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
            deleted: false
        })
    });

    if (!reativarResponse.ok) {
        const data = await reativarResponse.json();
        throw new Error(data.message || "Error reactivating user.")
    }
    return true;
}

async function reiniciarSenha(email) {
    console.log(`Reiniciando senha para ${email}`)
    const response = await fetch(`${BASE_URL}users/${email}`, {
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resetPasswordRequested: true }),
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

    function perfilTotexto(perfil) {
        switch (perfil) {
            case 'ADMINISTRATOR':
                return 'Administrator';
            case 'CRAAM_RESEARCHER':
                return 'Craam Researcher';
            case 'SOLAR_PHYSICIST':
                return 'Solar Physicist';
            default:
                return perfil || 'Unknown';
        }
    }

    async function carregarUsuarios() {
        console.log('Carregando usuários...')
        try {
            const usuarios = await listarUsuarios();
            usuariosOriginais = Array.isArray(usuarios.data) ? usuarios.data : usuarios;
            aplicarFiltros();
        } catch (error) {
            mensagemErro.textContent = error.message || 'Error loading users';
            mensagemErro.style.display = 'block';
        }
    }

    const filtroPerfil = document.getElementById('filtroPerfil');
    const filtroStatus = document.getElementById('filtroStatus');

    filtroPerfil.addEventListener('change', aplicarFiltros);
    filtroStatus.addEventListener('change', aplicarFiltros);

    let usuariosOriginais = [];

    function aplicarFiltros() {
        const perfilSelecionado = filtroPerfil.value;
        const statusSelecionado = filtroStatus.value;

        let usuariosFiltrados = [...usuariosOriginais];

        if (perfilSelecionado && perfilSelecionado !== 'Todos') {
            usuariosFiltrados = usuariosFiltrados.filter(usuario => {
                const perfil = usuario.profile?.type ?? '';
                return perfil === perfilSelecionado;
            });
        }

        if (statusSelecionado && statusSelecionado !== 'Todos') {
            usuariosFiltrados = usuariosFiltrados.filter(usuario => {
                const status = usuario.deleted ? 'deletado' : 'ativo';
                return status === statusSelecionado;
            })
        }
        preencherTabela(usuariosFiltrados);
    }

    function preencherTabela(usuarios) {
        console.log('Preenchendo tabela com usuários', usuarios)
        tbody.innerHTML = '';

        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">User not found.</td></tr>';
            return;
        }

        usuarios.forEach((usuario) => {
            const tr = document.createElement('tr');

            const nome = usuario.name || usuario.fullName || 'N/A';
            const email = usuario.email || 'N/A';
            const perfil = perfilTotexto(usuario.profile?.type || 'N/A');
            const status = usuario.deleted ? 'Deleted' : 'Active';


            tr.innerHTML = `
                <td>${nome}</td>
                <td>${email}</td>
                <td>${perfil}</td>
                <td>${status}</td>
                <td class="acoes">
                    <button class="edit" data-email="${email}">Edit</button>
                    <button class="resetar_password" data-email="${email}">Reset Password</button>
                    ${usuario.deleted
                    ? `<button class="reativar" data-email="${email}">Reactivate</button>`
                    : `<button class="deletar" data-email="${email}">Delete</button>`}
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
        console.log('Enviando formulário de cadastro')
        esconderMensagens();

        const nome = document.getElementById('nomeNovoUsuario').value.trim();
        const email = document.getElementById('emailNovoUsuario').value.trim();
        const senha = document.getElementById('senhaNovoUsuario').value.trim();
        const perfilSelecionado = document.querySelector('input[name="perfilNovoUsuario"]:checked');

        if (!nome || !email || !senha || !perfilSelecionado) {
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
                password: senha,
                fullName: nome,
                email: email,
                profileType: perfilSelecionado.value
            });

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
});
