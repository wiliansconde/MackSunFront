const tbodyMainFlares = document.getElementById('tbody_main_flares');
const maxRows = 5;

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

async function listarFlaresParaInicio() {
    try {
        const response = await fetch(`${BASE_URL}flares/public`); 

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error fetching flares.' }));
            throw new Error(errorData.message || 'Error fetching flares for main page.');
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error fetching flares for home page:', error);
        return [];
    }
}

function preencherTabelaParaInicio(flares) {
    if (!tbodyMainFlares) {
        console.error("Element 'tbody_main_flares' not found. Check the ID in the HTML.");
        return;
    }

    tbodyMainFlares.innerHTML = '';

    if (!flares || flares.length === 0) {
        const row = tbodyMainFlares.insertRow();
        row.innerHTML = `<td colspan="4" class="no-data-message">flare not found.</td>`;
        return;
    }

    const flaresToDisplay = flares.slice(0, maxRows);

    flaresToDisplay.forEach(flare => {
        const row = tbodyMainFlares.insertRow();
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
            <td class="texto-longo">${descricaoLimitada}</td>
        `;
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const flares = await listarFlaresParaInicio();
    preencherTabelaParaInicio(flares);
});
