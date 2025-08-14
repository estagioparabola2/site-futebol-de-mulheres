const supabase = window.supabase;

let currentPage = 1;
const eventsPerPage = 10;

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
    setupEventListeners();
});

async function loadEvents(page = 1, filters = {}) {
    currentPage = page;
    const tableBody = document.getElementById('eventos-table');
    tableBody.innerHTML = '<tr><td colspan="5">Carregando eventos...</td></tr>';

    let query = supabase
        .from('eventos')
        .select('*', { count: 'exact' })
        .order('data_inicio', { ascending: true })
        .range((page - 1) * eventsPerPage, page * eventsPerPage - 1);

    // Aplicar filtros
    if (filters.status) {
        query = query.eq('status', filters.status);
    }
    if (filters.date) {
        const startDate = new Date(filters.date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(filters.date);
        endDate.setHours(23, 59, 59, 999);
        query = query.gte('data_inicio', startDate.toISOString())
                   .lte('data_inicio', endDate.toISOString());
    }

    const { data: eventos, count, error } = await query;

    if (error) {
        tableBody.innerHTML = '<tr><td colspan="5">Erro ao carregar eventos</td></tr>';
        console.error(error);
        return;
    }

    if (eventos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">Nenhum evento encontrado</td></tr>';
        return;
    }

    renderEvents(eventos, count);
}

function renderEvents(eventos, totalCount) {
    const tableBody = document.getElementById('eventos-table');
    tableBody.innerHTML = '';

    eventos.forEach(evento => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <strong>${evento.titulo}</strong>
                <div class="text-muted small">${formatDate(evento.data_inicio)}</div>
            </td>
            <td>${formatDateTime(evento.data_inicio)}</td>
            <td>${evento.local}</td>
            <td>
                <span class="evento-status ${getStatusClass(evento.status)}">
                    ${formatStatus(evento.status)}
                </span>
            </td>
            <td class="text-nowrap">
                <a href="editar.html?id=${evento.id}" class="btn btn-sm btn-primary me-1">
                    <i class="bi bi-pencil"></i>
                </a>
                <button class="btn btn-sm btn-danger" data-id="${evento.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        // Adicionar evento de clique para o botão de excluir
        row.querySelector('.btn-danger').addEventListener('click', () => {
            deleteEvento(evento.id);
        });

        tableBody.appendChild(row);
    });

    updatePaginationControls(totalCount);
}

function setupEventListeners() {
    // Filtros
    document.getElementById('filter-status').addEventListener('change', async (e) => {
        const filters = {
            status: e.target.value || undefined,
            date: document.getElementById('filter-date').value || undefined
        };
        await loadEvents(1, filters);
    });

    document.getElementById('filter-date').addEventListener('change', async (e) => {
        const filters = {
            status: document.getElementById('filter-status').value || undefined,
            date: e.target.value || undefined
        };
        await loadEvents(1, filters);
    });

    document.getElementById('btn-reset-filters').addEventListener('click', async () => {
        document.getElementById('filter-status').value = '';
        document.getElementById('filter-date').value = '';
        await loadEvents(1, {});
    });

    // Paginação
    document.getElementById('btn-prev').addEventListener('click', async () => {
        if (currentPage > 1) {
            const filters = getCurrentFilters();
            await loadEvents(currentPage - 1, filters);
        }
    });

    document.getElementById('btn-next').addEventListener('click', async () => {
        const totalPages = Math.ceil(parseInt(document.getElementById('total-events').value) / eventsPerPage);
        if (currentPage < totalPages) {
            const filters = getCurrentFilters();
            await loadEvents(currentPage + 1, filters);
        }
    });
}

function getCurrentFilters() {
    return {
        status: document.getElementById('filter-status').value || undefined,
        date: document.getElementById('filter-date').value || undefined
    };
}

function updatePaginationControls(totalCount) {
    const totalPages = Math.ceil(totalCount / eventsPerPage);
    document.getElementById('page-info').textContent = `Página ${currentPage} de ${totalPages}`;
    document.getElementById('btn-prev').disabled = currentPage <= 1;
    document.getElementById('btn-next').disabled = currentPage >= totalPages;
    
    // Armazenar total de eventos para paginação
    const totalInput = document.createElement('input');
    totalInput.type = 'hidden';
    totalInput.id = 'total-events';
    totalInput.value = totalCount;
    document.querySelector('.pagination').prepend(totalInput);
}

async function deleteEvento(id) {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) return;
    
    const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', id);
    
    if (error) {
        alert('Erro ao excluir evento: ' + error.message);
        console.error(error);
        return;
    }
    
    alert('Evento excluído com sucesso');
    const filters = getCurrentFilters();
    await loadEvents(currentPage, filters);
}

// Funções auxiliares
function formatDateTime(dateString) {
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleString('pt-BR', options);
}

function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function formatStatus(status) {
    const statusMap = {
        'planejado': 'Planejado',
        'confirmado': 'Confirmado',
        'cancelado': 'Cancelado',
        'realizado': 'Realizado',
        'adiado': 'Adiado'
    };
    return statusMap[status] || status;
}

function getStatusClass(status) {
    return `status-${status}`;
}