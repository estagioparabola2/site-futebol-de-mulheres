document.addEventListener('DOMContentLoaded', () => {
    const carrosselList = document.getElementById('carrossel-list');
    const formNoticia = document.getElementById('formNoticia');
    const salvarBtn = document.getElementById('salvar-carrossel');
    const imagemInput = document.getElementById('carrossel-imagem');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    let editingId = null;

    // Preview da imagem
    imagemInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';
            }
            reader.readAsDataURL(file);
        }
    });

    // Carregar itens do carrossel
    async function loadCarrossel() {
        const { data, error } = await supabase
            .from('carrossel_noticias')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar carrossel:', error);
            return;
        }

        carrosselList.innerHTML = '';
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.titulo}</td>
                <td>${getCategoryName(item.categoria)}</td>
                <td>${item.ativo ? '<span class="badge bg-success">Ativo</span>' : '<span class="badge bg-secondary">Inativo</span>'}</td>
                <td>${item.descricao}</td>
                <td><img src="${item.imagem_url}" alt="${item.titulo}" style="max-width: 80px; max-height: 40px; object-fit: cover;"></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary edit-btn" data-id="${item.id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-btn" data-id="${item.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                        <button class="btn btn-outline-secondary toggle-btn" data-id="${item.id}" data-status="${item.ativo}">
                            <i class="bi ${item.ativo ? 'bi-eye-slash' : 'bi-eye'}"></i>
                        </button>
                    </div>
                </td>
            `;
            carrosselList.appendChild(row);
        });

        addEventListeners();
    }

    function getCategoryName(category) {
        const categories = {
            'noticias': 'Notícias',
            'selecao': 'Seleção Brasileira',
            'campeonato': 'Campeonato Brasileiro',
            'jogadoras': 'Jogadoras em Destaque'
        };
        return categories[category] || category;
    }

    // Adicionar eventos aos botões
    function addEventListeners() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', editItem);
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteItem);
        });

        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', toggleStatus);
        });
    }

    // Editar item
    async function editItem(e) {
        const id = e.target.closest('.edit-btn').dataset.id;
        const { data, error } = await supabase
            .from('carrossel_noticias')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar item:', error);
            return;
        }

        editingId = id;
        document.getElementById('carrossel-titulo').value = data.titulo;
        document.getElementById('carrossel-descricao').value = data.descricao || '';
        document.getElementById('carrossel-categoria').value = data.categoria;
        document.getElementById('carrossel-link').value = data.link_url || '';
        document.getElementById('carrossel-link-texto').value = data.link_texto || 'Saiba mais';
        
        // Mostrar preview da imagem existente
        if (data.imagem_url) {
            previewImage.src = data.imagem_url;
            imagePreview.style.display = 'block';
        }

        const modal = new bootstrap.Modal(document.getElementById('novaNoticiaModal'));
        modal.show();
    }

    // Deletar item
    async function deleteItem(e) {
        const id = e.target.closest('.delete-btn').dataset.id;
        if (confirm('Tem certeza que deseja excluir este item do carrossel?')) {
            const { error } = await supabase
                .from('carrossel_noticias')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao deletar item:', error);
                alert('Erro ao excluir item');
            } else {
                loadCarrossel();
            }
        }
    }

    // Alternar status ativo/inativo
    async function toggleStatus(e) {
        const id = e.target.closest('.toggle-btn').dataset.id;
        const currentStatus = e.target.closest('.toggle-btn').dataset.status === 'true';
        
        const { error } = await supabase
            .from('carrossel_noticias')
            .update({ ativo: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error('Erro ao atualizar status:', error);
            alert('Erro ao alterar status');
        } else {
            loadCarrossel();
        }
    }

    // Salvar item (criar ou atualizar)
    salvarBtn.addEventListener('click', async () => {
        const titulo = document.getElementById('carrossel-titulo').value || '';
        const descricao = document.getElementById('carrossel-descricao').value;
        const categoria = document.getElementById('carrossel-categoria').value;
        const link = document.getElementById('carrossel-link').value;
        const linkTexto = document.getElementById('carrossel-link-texto').value;
        const imagemFile = imagemInput.files[0];

        if (!titulo || !categoria) {
            alert('Título e categoria são obrigatórios');
            return;
        }

        let imagemUrl = '';
        
        // Se há um novo arquivo de imagem, fazer upload
        if (imagemFile) {
            const fileName = `carrossel-${Date.now()}-${imagemFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('carrossel')
                .upload(fileName, imagemFile);

            if (uploadError) {
                console.error('Erro no upload da imagem:', uploadError);
                alert('Erro ao fazer upload da imagem');
                return;
            }

            const { data: { publicUrl } } = supabase
                .storage
                .from('carrossel')
                .getPublicUrl(fileName);
                
            imagemUrl = publicUrl;
        }

        const itemData = {
            titulo,
            descricao,
            categoria,
            link_url: link,
            link_texto: linkTexto,
            ativo: true,
            data_publicacao: new Date()
        };

        if (imagemUrl) {
            itemData.imagem_url = imagemUrl;
        }

        if (editingId) {
            // Atualizar item existente
            const { error } = await supabase
                .from('carrossel_noticias')
                .update(itemData)
                .eq('id', editingId);

            if (error) {
                console.error('Erro ao atualizar item:', error);
                alert('Erro ao atualizar item');
            } else {
                loadCarrossel();
                resetForm();
                bootstrap.Modal.getInstance(document.getElementById('novaNoticiaModal')).hide();
            }
        } else {
            // Criar novo item
            const { error } = await supabase
                .from('carrossel_noticias')
                .insert([itemData]);

            if (error) {
                console.error('Erro ao criar item:', error);
                alert('Erro ao criar novo item');
            } else {
                loadCarrossel();
                resetForm();
                bootstrap.Modal.getInstance(document.getElementById('novaNoticiaModal')).hide();
            }
        }
    });

    // Resetar formulário
    function resetForm() {
        formNoticia.reset();
        editingId = null;
        imagePreview.style.display = 'none';
        previewImage.src = '#';
        imagemInput.value = '';
    }

    // Resetar formulário quando o modal é fechado
    document.getElementById('novaNoticiaModal').addEventListener('hidden.bs.modal', resetForm);

    // Carregar dados iniciais
    loadCarrossel();
});