const supabase = window.supabase;
let currentPage = 1;
const itemsPerPage = 8;
let totalArticles = 0;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { count } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true })
            .eq('tipo_pesquisa', 'doutorado');

        totalArticles = count;

        await mostrarArtigos(currentPage);
        await configurarPaginacao();
    } catch (error) {
        console.error('Erro ao carregar artigos:', error);
    }
});

const mostrarArtigos = async (pagina) => {
    const container = document.getElementById('article-artigos');
    if (!container) {
        console.error('Elemento com ID "article-artigos" não encontrado.');
        return;
    }

    try {
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando artigos...</div>';

        const from = (pagina - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        const { data: artigos, error } = await supabase
            .from('artigos')
            .select('*')
            .eq('tipo_pesquisa', 'doutorado')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        if (!artigos || artigos.length === 0) {
            container.innerHTML = '<div class="no-articles">Nenhum artigo encontrado.</div>';
            return;
        }

        container.innerHTML = '';

        artigos.forEach((artigo) => {
            const linkHTML = artigo.link_artigo
                ? `<a href="${artigo.link_artigo}" class="article-link" target="_blank" rel="noopener noreferrer">Ler Tese</a>`
                : `<span class="article-link disabled">Link não disponível</span>`;

            container.innerHTML += `
                <div class="article-section" data-id="${artigo.id}">
                    <p class="institution">${artigo.tipo_pesquisa || ''}</p>
                    <h3 class="article-title">${artigo.titulo.toLowerCase()}</h3>
                    <p class="institution">${artigo.instituto || ''}</p>
                    <p>${artigo.descricao}</p>
                    ${linkHTML}
                </div>
            `;
        });

        currentPage = pagina;
        await configurarPaginacao();
    } catch (error) {
        container.innerHTML = '<div class="error">Erro ao carregar artigos. Tente novamente mais tarde.</div>';
    }
};

const configurarPaginacao = async () => {
    const paginacao = document.getElementById('pagination');
    if (!paginacao) return;

    const totalPages = Math.ceil(totalArticles / itemsPerPage);
    paginacao.innerHTML = '';

    const btnAnterior = document.createElement('li');
    btnAnterior.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    btnAnterior.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    btnAnterior.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            await mostrarArtigos(currentPage - 1);
        }
    });
    paginacao.appendChild(btnAnterior);

    const maxPaginasVisiveis = 3;
    let startPage, endPage;

    if (totalPages <= maxPaginasVisiveis) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const meio = Math.floor(maxPaginasVisiveis / 2);

        if (currentPage <= meio + 1) {
            startPage = 1;
            endPage = maxPaginasVisiveis;
        } else if (currentPage >= totalPages - meio) {
            startPage = totalPages - maxPaginasVisiveis + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - meio;
            endPage = currentPage + meio;
        }
    }

    if (startPage > 1) {
        const first = document.createElement('li');
        first.className = 'page-item';
        first.innerHTML = `<a class="page-link" href="#">1</a>`;
        first.addEventListener('click', async (e) => {
            e.preventDefault();
            await mostrarArtigos(1);
        });
        paginacao.appendChild(first);

        if (startPage > 2) {
            const ellipsis = document.createElement('li');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = `<span class="page-link">...</span>`;
            paginacao.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', async (e) => {
            e.preventDefault();
            await mostrarArtigos(i);
        });
        paginacao.appendChild(pageItem);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('li');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = `<span class="page-link">...</span>`;
            paginacao.appendChild(ellipsis);
        }

        const last = document.createElement('li');
        last.className = 'page-item';
        last.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
        last.addEventListener('click', async (e) => {
            e.preventDefault();
            await mostrarArtigos(totalPages);
        });
        paginacao.appendChild(last);
    }

    const btnProximo = document.createElement('li');
    btnProximo.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    btnProximo.innerHTML = `
        <a class="page-link" href="#" aria-label="Próximo">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    btnProximo.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            await mostrarArtigos(currentPage + 1);
        }
    });
    paginacao.appendChild(btnProximo);
};
