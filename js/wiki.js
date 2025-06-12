document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const snippetsContainer = document.getElementById('snippets-container');

    if (!token) {
        console.error('Token não encontrado no localStorage. Não é possível buscar os snippets da wiki.');
        snippetsContainer.innerHTML = '<p class="invalid_message_error">Faça login para ver os snippets da wiki.</p>';
        return;
    }

    try {
        const response = await fetch('https://macksunback.azurewebsites.net/wiki', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao buscar snippets: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            result.data.forEach(snippet => {
                const card = document.createElement('div');
                card.classList.add('snippet-card');

                card.innerHTML = `
                    <h3>Instrument: ${snippet.instrument}</h3>
                    <p><strong>Format:</strong> ${snippet.format}</p>
                    <p><strong>Description:</strong> ${snippet.description}</p>
                    <p><strong>Code:</strong></p>
                    <pre>${snippet.code}</pre>
                `;
                snippetsContainer.appendChild(card);
            });
        } else {
            snippetsContainer.innerHTML = '<p>Nenhum snippet da wiki encontrado.</p>';
        }

    } catch (error) {
        console.error('Erro ao carregar snippets da wiki:', error);
        snippetsContainer.innerHTML = `<p class="invalid_message_error">Ocorreu um erro ao carregar os snippets: ${error.message}</p>`;
    }
});