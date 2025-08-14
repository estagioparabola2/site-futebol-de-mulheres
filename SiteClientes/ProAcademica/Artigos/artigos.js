const supabase = window.supabase;
let currentPage = 1;
const itemsPerPage = 8; // Número de artigos por página
let totalArticles = 0;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { count } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true });

        totalArticles = count;

        await MostraArtigos(currentPage);
        await setupPagination(totalArticles);
    } catch (error) {
        console.error('Erro ao carregar artigos:', error);
    }
});

const MostraArtigos = async (page) => {
    const activityList = document.getElementById('article-artigos');
    if (!activityList) {
        console.error('Elemento com ID "article-artigos" não encontrado.');
        return;
    }
    //carregar a atividade de artigos
    try {
        // Mostrar estado de carregamento
        activityList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i>Carregando artigos...</div>';

        const from = (page - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data: artigos, error } = await supabase
            .from('artigos')
            .select('*')
            .in('tipo_pesquisa', ['artigo científicos original', 'artigo científicos revisão'])
            .order('created_at', { ascending: false })
            .range(from, to);



        if (error) throw error || 'Erro ao carregar artigos';

        if (!artigos || artigos.length === 0) {
            activityList.innerHTML = '<div class="no-articles">Nenhum artigo encontrado.</div>';
            return;
        }

        // renderizar atividade
        activityList.innerHTML = '';
        artigos.forEach(artigoss => {
            const linkHTML = artigoss.link_artigo
                ? `<a href="${artigoss.link_artigo}" class="article-link" target="_blank" rel="noopener noreferrer">Ler Artigo</a>`
                : `<span class="article-link disabled">Link não disponível</span>`;

            activityList.innerHTML += `
        <div class="article-section" data-id="${artigoss.id}">
            <p class="institution">${artigoss.tipo_pesquisa || ''}</p>
            <h3 class="article-title">${artigoss.titulo.toLowerCase()}</h3>
            <p class="institution">${artigoss.instituto || ''}</p>
            <p>${artigoss.descricao}</p>
            ${linkHTML}
        </div>
    `;
        });

        currentPage = page;
        await setupPagination();

    } catch (error) {
        activityList.innerHTML = '<div class="error">Erro ao carregar artigos. Tente novamente mais tarde.</div>';
    }
}

async function setupPagination(totalItems) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    pagination.innerHTML = '';

    // Botão Anterior
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `<a class="page-link" href="#" aria-label="Anterior">&laquo;</a>`;
    prevItem.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            currentPage--;
            await MostraArtigos(currentPage);
        }
    });
    pagination.appendChild(prevItem);

    const maxVisiblePages = 3;
    let startPage, endPage;

    if (totalPages <= maxVisiblePages) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const meio = Math.floor(maxVisiblePages / 2);
        if (currentPage <= meio + 1) {
            startPage = 1;
            endPage = maxVisiblePages;
        } else if (currentPage >= totalPages - meio) {
            startPage = totalPages - maxVisiblePages + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - meio;
            endPage = currentPage + meio;
        }
    }

    // Primeira página + ellipsis
    if (startPage > 1) {
        addPageItem(pagination, 1);
        if (startPage > 2) addEllipsis(pagination);
    }

    // Páginas visíveis
    for (let i = startPage; i <= endPage; i++) {
        addPageItem(pagination, i, i === currentPage);
    }

    // Última página + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) addEllipsis(pagination);
        addPageItem(pagination, totalPages);
    }

    // Botão Próximo
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `<a class="page-link" href="#" aria-label="Próximo">&raquo;</a>`;
    nextItem.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            await MostraArtigos(currentPage);
        }
    });
    pagination.appendChild(nextItem);
}

// Função auxiliar para criar item de página
function addPageItem(container, pageNumber, isActive = false) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${isActive ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${pageNumber}</a>`;
    pageItem.addEventListener('click', async (e) => {
        e.preventDefault();
        currentPage = pageNumber;
        await MostraArtigos(pageNumber);
    });
    container.appendChild(pageItem);
}

// Função auxiliar para criar reticências
function addEllipsis(container) {
    const ellipsisItem = document.createElement('li');
    ellipsisItem.className = 'page-item disabled';
    ellipsisItem.innerHTML = `<span class="page-link">...</span>`;
    container.appendChild(ellipsisItem);
}
