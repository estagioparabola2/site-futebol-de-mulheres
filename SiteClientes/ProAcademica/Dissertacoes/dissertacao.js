const supabase = window.supabase; // Referência para o cliente Supabase
let currentPage = 1; // Página atual
const itemsPerPage = 8; // Quantidade de artigos por página
let totalArticles = 0; // Total de artigos encontrados

document.addEventListener('DOMContentLoaded', async () => { // Quando o DOM carregar
    try {
        // Busca o total de artigos do tipo "dissertacao"
        const { count } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true })
            .eq('tipo_pesquisa', 'dissertacao');

        totalArticles = count; // Guarda o total de artigos

        await mostrarArtigos(currentPage); // Mostra artigos da primeira página
        await configurarPaginacao(); // Configura a paginação
    } catch (error) {
        console.error('Erro ao carregar artigos:', error); // Log de erro
    }
});

const mostrarArtigos = async (pagina) => { // Função para exibir artigos de uma página
    const container = document.getElementById('article-artigos'); // Container dos artigos
    if (!container) {
        console.error('Elemento com ID "article-artigos" não encontrado.'); // Verifica se existe
        return;
    }

    try {
        // Mostra o texto de carregamento
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando artigos...</div>';

        // Calcula o intervalo de artigos a buscar
        const from = (pagina - 1) * itemsPerPage;
        const to = from + itemsPerPage - 1;

        // Busca os artigos no Supabase
        const { data: artigos, error } = await supabase
            .from('artigos')
            .select('*')
            .eq('tipo_pesquisa', 'dissertacao')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error; // Lança erro se houver

        // Caso não encontre artigos
        if (!artigos || artigos.length === 0) {
            container.innerHTML = '<div class="no-articles">Nenhum artigo encontrado.</div>';
            return;
        }

        container.innerHTML = ''; // Limpa o container

        // Loop pelos artigos encontrados
        artigos.forEach((artigo) => {
            // Cria link do artigo ou texto alternativo
            const linkHTML = artigo.link_artigo
                ? `<a href="${artigo.link_artigo}" class="article-link" target="_blank" rel="noopener noreferrer">Ler Dissertação</a>`
                : `<span class="article-link disabled">Link não disponível</span>`;

            // Adiciona o HTML do artigo no container
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

        currentPage = pagina; // Atualiza a página atual
        await configurarPaginacao(); // Atualiza a paginação
    } catch (error) {
        // Mensagem de erro na tela
        container.innerHTML = '<div class="error">Erro ao carregar artigos. Tente novamente mais tarde.</div>';
    }
};

const configurarPaginacao = async () => { // Função para criar paginação
    const paginacao = document.getElementById('pagination'); // Container da paginação
    if (!paginacao) return; // Se não existir, não faz nada

    const totalPages = Math.ceil(totalArticles / itemsPerPage); // Calcula total de páginas
    paginacao.innerHTML = ''; // Limpa a paginação

    // Botão Anterior
    const btnAnterior = document.createElement('li'); // Cria elemento
    btnAnterior.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`; // Desativa se for página 1
    btnAnterior.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    // Evento para voltar uma página
    btnAnterior.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage > 1) {
            await mostrarArtigos(currentPage - 1);
        }
    });
    paginacao.appendChild(btnAnterior); // Adiciona na paginação

    const maxPaginasVisiveis = 3; // Máximo de páginas visíveis
    let startPage, endPage; // Variáveis para início e fim

    // Define início e fim das páginas
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

    // Botão para primeira página
    if (startPage > 1) {
        const first = document.createElement('li');
        first.className = 'page-item';
        first.innerHTML = `<a class="page-link" href="#">1</a>`;
        first.addEventListener('click', async (e) => {
            e.preventDefault();
            await mostrarArtigos(1);
        });
        paginacao.appendChild(first);

        // Reticências
        if (startPage > 2) {
            const ellipsis = document.createElement('li');
            ellipsis.className = 'page-item disabled';
            ellipsis.innerHTML = `<span class="page-link">...</span>`;
            paginacao.appendChild(ellipsis);
        }
    }

    // Páginas intermediárias
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

    // Botão para última página
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

    // Botão Próximo
    const btnProximo = document.createElement('li');
    btnProximo.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    btnProximo.innerHTML = `
        <a class="page-link" href="#" aria-label="Próximo">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    // Evento para ir para próxima página
    btnProximo.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            await mostrarArtigos(currentPage + 1);
        }
    });
    paginacao.appendChild(btnProximo);
};
