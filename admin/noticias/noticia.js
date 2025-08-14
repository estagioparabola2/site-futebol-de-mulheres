const supabase = window.supabase;
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener("DOMContentLoaded", async () => {
    await carregarNoticias();
    configurarEventos();
    initModal();
});

async function carregarNoticias(pagina = 1) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const noticiasContainer = document.getElementById('noticias-container');
    const paginationInfo = document.getElementById('pagination-info');
    
    loadingIndicator.classList.remove('d-none');
    noticiasContainer.innerHTML = '';

    try {
        // Calcular offset para paginação
        const offset = (pagina - 1) * itemsPerPage;
        
        // Buscar notícias com paginação
        const { data: noticias, error, count } = await supabase
            .from('noticias')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + itemsPerPage - 1);

        if (error) throw error;

        // Renderizar notícias
        if (noticias && noticias.length > 0) {
            noticiasContainer.innerHTML = noticias.map(noticia => `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${noticia.titulo}</h5>
                            <div>
                                <button class="btn btn-sm btn-outline-primary me-2 edit-btn" data-id="${noticia.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${noticia.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                        <p class="card-text">${noticia.resumo || 'Sem resumo disponível'}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">${formatarData(noticia.created_at)}</small>
                            <span class="badge bg-secondary">${noticia.categoria || 'Geral'}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Atualizar informações de paginação
            const totalPages = Math.ceil(count / itemsPerPage);
            paginationInfo.innerHTML = `
                Página ${pagina} de ${totalPages} | Total: ${count} notícias
            `;

            // Habilitar/desabilitar botões de paginação
            document.getElementById('prev-page').disabled = pagina <= 1;
            document.getElementById('next-page').disabled = pagina >= totalPages;
        } else {
            noticiasContainer.innerHTML = `
                <div class="alert alert-info">Nenhuma notícia encontrada</div>
            `;
        }
    } catch (error) {
        console.error('Erro ao carregar notícias:', error);
        noticiasContainer.innerHTML = `
            <div class="alert alert-danger">Erro ao carregar notícias: ${error.message}</div>
        `;
    } finally {
        loadingIndicator.classList.add('d-none');
        currentPage = pagina;
    }
}

function configurarEventos() {
    // Paginação
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) carregarNoticias(currentPage - 1);
    });

    document.getElementById('next-page').addEventListener('click', () => {
        carregarNoticias(currentPage + 1);
    });

    // Botão de nova notícia
    document.getElementById('nova-noticia-btn').addEventListener('click', () => {
        document.getElementById('noticia-id').value = '';
        document.getElementById('noticia-form').reset();
        new bootstrap.Modal(document.getElementById('noticia-modal')).show();
    });

    // Delegar eventos para botões dinâmicos
    document.addEventListener('click', async (e) => {
        // Edição
        if (e.target.closest('.edit-btn')) {
            const id = e.target.closest('.edit-btn').dataset.id;
            await carregarNoticiaParaEdicao(id);
        }
        
        // Exclusão
        if (e.target.closest('.delete-btn')) {
            const id = e.target.closest('.delete-btn').dataset.id;
            if (confirm('Tem certeza que deseja excluir esta notícia?')) {
                await excluirNoticia(id);
            }
        }
    });

    // Formulário de submissão
    document.getElementById('noticia-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarNoticia();
    });
}

async function carregarNoticiaParaEdicao(id) {
    try {
        const { data: noticia, error } = await supabase
            .from('noticias')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Preencher formulário
        document.getElementById('noticia-id').value = noticia.id;
        document.getElementById('titulo').value = noticia.titulo;
        document.getElementById('resumo').value = noticia.resumo || '';
        document.getElementById('conteudo').value = noticia.conteudo || '';
        document.getElementById('categoria').value = noticia.categoria || 'Geral';
        
        // Abrir modal
        new bootstrap.Modal(document.getElementById('noticia-modal')).show();
    } catch (error) {
        console.error('Erro ao carregar notícia:', error);
        alert('Erro ao carregar notícia para edição');
    }
}

async function salvarNoticia() {
    const form = document.getElementById('noticia-form');
    const id = document.getElementById('noticia-id').value;
    const submitBtn = document.getElementById('noticia-submit-btn');
    const modal = bootstrap.Modal.getInstance(document.getElementById('noticia-modal'));

    const noticiaData = {
        titulo: form.titulo.value,
        resumo: form.resumo.value,
        conteudo: form.conteudo.value,
        categoria: form.categoria.value,
        updated_at: new Date().toISOString()
    };

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';

        if (id) {
            // Atualizar notícia existente
            const { error } = await supabase
                .from('noticias')
                .update(noticiaData)
                .eq('id', id);

            if (error) throw error;
            alert('Notícia atualizada com sucesso!');
        } else {
            // Criar nova notícia
            noticiaData.created_at = new Date().toISOString();
            const { error } = await supabase
                .from('noticias')
                .insert([noticiaData]);

            if (error) throw error;
            alert('Notícia criada com sucesso!');
        }

        modal.hide();
        await carregarNoticias(currentPage);
    } catch (error) {
        console.error('Erro ao salvar notícia:', error);
        alert('Erro ao salvar notícia: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar Notícia';
    }
}

async function excluirNoticia(id) {
    try {
        const { error } = await supabase
            .from('noticias')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Notícia excluída com sucesso!');
        await carregarNoticias(currentPage);
    } catch (error) {
        console.error('Erro ao excluir notícia:', error);
        alert('Erro ao excluir notícia: ' + error.message);
    }
}

function initModal() {
    // Configuração do editor de texto (opcional)
    // Exemplo com TinyMCE (você precisaria incluir a biblioteca)
    if (typeof tinymce !== 'undefined') {
        tinymce.init({
            selector: '#conteudo',
            plugins: 'link lists',
            toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | link',
            height: 300
        });
    }
}

function formatarData(dataString) {
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dataString).toLocaleString('pt-BR', options);
}