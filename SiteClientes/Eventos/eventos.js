const supabase = window.supabase;
let currentPage = 1;
const itemsPerPage = 6; // Número de eventos por página
let totalEvents = 0;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { count } = await supabase
            .from('eventos')
            .select('*', { count: 'exact', head: true });

        totalEvents = count;

        await MostraEventos(currentPage);
        await setupPagination();
    } catch (error) {
        console.error(error);
    }
});

const MostraEventos = async (page) => {
    const activityList = document.getElementById('article-eventos');
    if (!activityList) {
        console.error('Elemento com ID "article-eventos" não encontrado.');
        return;
    }
    //carregar a atividade de eventos
    try {
        // Mostrar estado de carregamento
        activityList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Carregando eventos...</div>';

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data: eventos, error } = await supabase
            .from('eventos')
            .select('*')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error || 'Erro ao carregar eventos';

        if (!eventos || eventos.length === 0) {
            activityList.innerHTML = '<div class="no-events">Nenhum evento encontrado.</div>';
            return;
        }

        // renderizar atividade
        activityList.innerHTML = '';
        eventos.forEach(evento => {
            const activityItem = document.createElement('article');
            activityItem.classList.add('event-card');

            activityItem.innerHTML = `
                <div class="" data-id="${evento.id}">
                    <img src="${evento.imagem}" alt="${evento.titulo}" class="event-image">
                    <h2>${evento.titulo}</h2>
                    <p>${evento.descricao}</p>
                    <a href="${evento.link_inscricao}" target="_blank" class="event-link">Visite a página do evento</a>
                </div>
            `;

            activityList.appendChild(activityItem);
        });

        currentPage = page;
        await setupPagination();

    } catch (error) {
        console.error('Erro ao exibir eventos:', error);
    }
}

const setupPagination = async () => {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalEvents / itemsPerPage);

    paginationContainer.innerHTML = '';

    // Botão Anterior
    const prevItem = document.createElement('li');
    prevItem.innerHTML = `
                <a class="page-link" href="#" aria-label="Anterior">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            `;
    prevItem.addEventListener('click', () => {
        if (currentPage > 1) {
            MostraEventos(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevItem);

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${currentPage === i ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', () => MostraEventos(i));
        paginationContainer.appendChild(pageItem);
    }

    // Botão Próximo
    const nextItem = document.createElement('li');
    nextItem.innerHTML = `
                <a class="page-link" href="#" aria-label="Próximo">
                    <span aria-hidden="true">&raquo;</span>
                </a>
    `;
    nextItem.addEventListener('click', () => {
        if (currentPage < totalPages) {
            MostraEventos(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextItem);
};