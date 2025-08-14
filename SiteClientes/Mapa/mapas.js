document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabase;
    let hideTimeout;
    let updateTimeout;
    let ultimoEstadoId = null;
    let currentPage = 1;
    const itemsPerPage = 8;
    let estadoSelecionado = null;

    // Cache simples para evitar buscas repetidas
    const cacheDados = {};

    // Elementos da UI
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');

    function showLoading() {
        if (loadingMessage) loadingMessage.style.display = 'block';
        if (errorMessage) errorMessage.style.display = 'none';
    }

    function hideLoading() {
        if (loadingMessage) loadingMessage.style.display = 'none';
    }

    function showError() {
        if (errorMessage) errorMessage.style.display = 'block';
        if (loadingMessage) loadingMessage.style.display = 'none';
    }

    async function buscarDados(estado, estadoId) {
        const mensagemTitulo = document.getElementById('mensagem-titulo');
        const mensagemLista = document.getElementById('mensagem-lista');

        if (!mensagemTitulo || !mensagemLista) return;

        mensagemTitulo.textContent = estado;
        mensagemLista.innerHTML = '<li>Carregando...</li>';

        // Verificar cache
        const cacheKey = `estado_${estadoId}`;
        if (cacheDados[cacheKey]) {
            atualizarMensagem(mensagemLista, cacheDados[cacheKey]);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('artigos_estado')
                .select('tipo_pesquisa, estado_uf')
                .eq('estado_uf', estadoId);

            if (error) throw error;

            if (data && data.length > 0) {
                // Processar e armazenar em cache
                const contagem = processarDados(data);
                cacheDados[cacheKey] = contagem;
                atualizarMensagem(mensagemLista, contagem);
            } else {
                mensagemLista.innerHTML = '<li>Nenhuma publicação encontrada.</li>';
            }
        } catch (err) {
            console.error('Erro ao buscar dados:', err);
            mensagemLista.innerHTML = '<li>Erro ao buscar dados.</li>';
        }
    }

    function processarDados(data) {
                const contagem = {
            'Mestrado': 0,
            'Doutorado': 0,
            'Artigo': 0
        };
        data.forEach(item => {
            let tipo = (item.tipo_pesquisa || '').toLowerCase();

            // Normalizar tipos de pesquisa
            if (tipo === 'dissertacao' || tipo === 'mestrado') {
                contagem['Mestrado']++;
            } else if (tipo === 'doutorado') {
                contagem['Doutorado']++;
            } else if (tipo.includes('artigo')) {
                contagem['Artigo']++;
            }
        });
        return contagem;
    }

    function atualizarMensagem(elemento, contagem) {
        elemento.innerHTML = '';
        Object.entries(contagem).forEach(([conteudo, quantidade]) => {
            const li = document.createElement('li');
            li.textContent = `${conteudo}: ${quantidade}`;
            elemento.appendChild(li);
        });
    }

    // Verifica se o usuário está em um dispositivo móvel
    function isMobile() {
        return window.innerWidth <= 700 ||
            /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    }

    function mostrarMensagem(event, estado, estadoId) {
        const mensagemFlutuante = document.getElementById('mensagem-flutuante');
        if (!mensagemFlutuante) return;

        mensagemFlutuante.style.display = 'block';
        
        
        if (isMobile()) {
            // Centralizar no mobile
            mensagemFlutuante.style.position = 'fixed';
            mensagemFlutuante.style.left = '50%';
            mensagemFlutuante.style.top = '50%';
            mensagemFlutuante.style.transform = 'translate(-50%, -50%)';
            mensagemFlutuante.style.zIndex = '1000';
            mensagemFlutuante.style.width = '80%';
        } else {
            // Posicionar próximo ao mouse no desktop
            mensagemFlutuante.style.position = 'absolute';
            mensagemFlutuante.style.transform = '';

            let left = event.pageX + 20;
            let top = event.pageY + 10;

            if (left + mensagemFlutuante.offsetWidth > window.innerWidth) {
                left = event.pageX - mensagemFlutuante.offsetWidth - 10;
            }

            if (top + mensagemFlutuante.offsetHeight > window.innerHeight) {
                top = event.pageY - mensagemFlutuante.offsetHeight - 10;
            }

            mensagemFlutuante.style.left = `${left}px`;
            mensagemFlutuante.style.top = `${top}px`;
        }

        if (ultimoEstadoId !== estadoId) {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                buscarDados(estado, estadoId);
                ultimoEstadoId = estadoId;
            }, 250);
        }
    }

    async function setupPagination(totalItems, estadoId = null) {
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
            await MostraEstado(currentPage, estadoId);
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
        addPageItem(pagination, 1, estadoId);
        if (startPage > 2) addEllipsis(pagination);
    }

    // Páginas visíveis
    for (let i = startPage; i <= endPage; i++) {
        addPageItem(pagination, i, estadoId, i === currentPage);
    }

    // Última página + ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) addEllipsis(pagination);
        addPageItem(pagination, totalPages, estadoId);
    }

    // Botão Próximo
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `<a class="page-link" href="#" aria-label="Próximo">&raquo;</a>`;
    nextItem.addEventListener('click', async (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
            currentPage++;
            await MostraEstado(currentPage, estadoId);
        }
    });
    pagination.appendChild(nextItem);
}

// Função auxiliar para criar item de página
function addPageItem(container, pageNumber, estadoId, isActive = false) {
    const pageItem = document.createElement('li');
    pageItem.className = `page-item ${isActive ? 'active' : ''}`;
    pageItem.innerHTML = `<a class="page-link" href="#">${pageNumber}</a>`;
    pageItem.addEventListener('click', async (e) => {
        e.preventDefault();
        currentPage = pageNumber;
        await MostraEstado(pageNumber, estadoId);
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


    async function MostraEstado(page, estadoId = null) {
        const activityList = document.getElementById('article-eventos');
        if (!activityList) return;

        showLoading();
        activityList.innerHTML = '';

        try {
            const from = (page - 1) * itemsPerPage;
            const to = from + itemsPerPage - 1;

            let query = supabase
                .from('artigos_estado')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            if (estadoId) {
                query = query.eq('estado_uf', estadoId);
            }

            const { data: eventos, count, error } = await query;

            if (error) throw error;

            hideLoading();

            if (!eventos || eventos.length === 0) {
                activityList.innerHTML = '<div class="alert alert-info">Nenhum artigo encontrado.</div>';
                return;
            }

            // Renderizar artigos
            eventos.forEach(evento => {
                const tipoPesquisa = normalizarTipoPesquisa(evento.tipo_pesquisa);

                const activityItem = document.createElement('article');
                activityItem.classList.add('event-card');
                activityItem.innerHTML = `
                    <div data-id="${evento.id}">
                        <h3>${tipoPesquisa}</h3>
                        <img src="${evento.imagem || 'https://i0.wp.com/multarte.com.br/wp-content/uploads/2018/12/fundo-cinza-claro4.png?resize=696%2C427&ssl=1'}" 
                             alt="${evento.titulo}" class="event-image">
                        <h2>${evento.titulo || 'Sem título'}</h2>
                        <strogan>Autores:</strogan>
                        <p> ${evento.autores || 'Autores não informados'}</p>
                        <strogan>Instituto:</strogan>
                        <p>${evento.instituto || 'Instituto não informado'}</p>
                        ${evento.url_doi ? `<a href="${evento.url_doi}" target="_blank" class="event-link">Visite a página</a>` : ''}
                    </div>
                `;
                activityList.appendChild(activityItem);
            });

            // Atualizar paginação
            await setupPagination(count, estadoId);

        } catch (error) {
            console.error('Erro ao exibir eventos:', error);
            showError();
        }
    }

    function normalizarTipoPesquisa(tipo) {
        if (!tipo) return 'Outro';

        tipo = tipo.toLowerCase();

        if (tipo === 'dissertacao') return 'Mestrado';
        if (tipo === 'doutorado') return 'Doutorado';
        // if (tipo === 'artigo científicos original') return 'Artigo Original';
        // if (tipo === 'artigo científicos revisão' || tipo === 'Artigo Revisão' || tipo === 'Artigo de revisao' || tipo === 'artigo revisao') return 'Artigo de Revisão';

        return tipo.charAt(0).toUpperCase() + tipo.slice(1);
    }

    // Inicialização
    function init() {
        // Configurar eventos dos estados do mapa
        document.querySelectorAll('svg a path').forEach((estado) => {
            estado.addEventListener('mousemove', (event) => {
                clearTimeout(hideTimeout);
                clearTimeout(updateTimeout);
                const texto = estado.getAttribute('title');
                const estadoId = estado.getAttribute('id');
                mostrarMensagem(event, texto, estadoId);
            });

            estado.addEventListener('mouseout', () => {
                hideTimeout = setTimeout(() => {
                    const mensagemFlutuante = document.getElementById('mensagem-flutuante');
                    if (mensagemFlutuante) {
                        mensagemFlutuante.style.display = 'none';
                    }
                }, 1000);
            });
        });

        // Clique nos estados
        document.querySelectorAll('svg a').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const estadoPath = this.querySelector('path');
                const estadoId = estadoPath.getAttribute('id');
                const estadoNome = estadoPath.getAttribute('title');

                if (estadoId && estadoNome) {
                    window.location.href = `../../ArtigoEstados/estado.html?estadoId=${estadoId}&estadoNome=${encodeURIComponent(estadoNome)}`;
                }
            });
        });

        // Carregar dados iniciais
        const params = new URLSearchParams(window.location.search);
        const estadoId = params.get('estadoId');
        MostraEstado(1, estadoId || null);
    }

    init();
});
