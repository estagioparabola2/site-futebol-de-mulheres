document.addEventListener('DOMContentLoaded', () => {

    if (!window.supabase || typeof window.supabase.from !== 'function') {
        console.error('Supabase client not properly initialized');
        const errorContainer = document.getElementById('photos-container');
        if (errorContainer) {
            errorContainer.innerHTML = '<p class="text-danger">Erro de configuração. Recarregue a página.</p>';
        }
        return;
    }

    // Procura container para galeria ou index
    const container = document.getElementById('gallery-grid') || document.getElementById('photos-container');
    if (!container) {
        console.warn('Nenhum container encontrado para exibir fotos.');
        return;
    }

    const isGallery = container.id === 'gallery-grid';
    const loadingElement = isGallery ? document.getElementById('loading') : null;
    const pagination = isGallery ? document.querySelector('.gallery-pagination') : null;

    // No index limit fixo 4, na galeria 8 fotos por página
    const limit = isGallery ? 8 : 4;

    // Carrega a primeira página
    fetchPhotos(container, loadingElement, limit, 1);

    // Cria paginação se precisar
    function setupPagination(totalPages) {
        if (!pagination) return;
        pagination.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const page = document.createElement('div');
            page.classList.add('page-number');
            if (i === 1) page.classList.add('active');
            page.textContent = i;
            page.addEventListener('click', () => {
                document.querySelectorAll('.page-number').forEach(el => el.classList.remove('active'));
                page.classList.add('active');
                fetchPhotos(container, loadingElement, limit, i);
            });
            pagination.appendChild(page);
        }
    }

    async function fetchPhotos(container, loadingElement, limit, page = 1) {
        try {
            if (loadingElement) loadingElement.style.display = 'block';
            container.innerHTML = '';

            const offset = (page - 1) * limit;

            let { data, error, count } = await window.supabase
                .from('galeria_fotos')
                .select('*', { count: 'exact' })
                .order('criado_em', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            if (data?.length > 0) {
                data.forEach(photo => {
                    if (container.id === 'photos-container') {
                        // Layout para index.html (4 fotos)
                        const col = document.createElement('div');
                        col.className = 'col-md-3 col-sm-6 mb-4';
                        col.innerHTML = `
                            <a href="#" data-toggle="modal" data-target="#photoModal${photo.id}">
                                <img src="${photo.url_imagem}" alt="${photo.descricao || 'Foto da galeria'}"
                                    class="img-responsive img-thumbnail" style="height: 200px; width: 100%; object-fit: cover; margin-bottom: 15px;">
                            </a>
                        `;
                        container.appendChild(col);
                    } else {
                        // Layout para galeria.html (com paginação)
                        const item = document.createElement('div');
                        item.className = 'gallery-item';
                        item.innerHTML = `
                            <img src="${photo.url_imagem}" alt="${photo.descricao || 'Foto da galeria'}">
                            <div class="gallery-caption">
                            </div>
                        `;
                        container.appendChild(item);
                    }
                });
            } else {
                container.innerHTML = '<p>Nenhuma foto encontrada.</p>';
            }

            // Cria paginação apenas na primeira página e se tiver contagem
            if (page === 1 && count && isGallery) {
                const totalPages = Math.ceil(count / limit);
                setupPagination(totalPages);
            }

        } catch (error) {
            console.error('Erro ao buscar fotos:', error);
            container.innerHTML = '<p>Erro ao carregar fotos. Tente novamente mais tarde.</p>';
        } finally {
            if (loadingElement) loadingElement.style.display = 'none';
        }
    }
});
