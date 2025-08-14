document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const galeriaContainer = document.getElementById('galeriaContainer');
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const previewContainer = document.getElementById('previewContainer');
    const confirmUpload = document.getElementById('confirmUpload');
    const uploadPreview = document.getElementById('uploadPreview');

    // Variáveis globais
    let selectedFiles = [];
    let currentImageId = null;

    // Inicialização
    loadGallery();
    setupEventListeners();

    // Função para carregar a galeria de fotos
    async function loadGallery() {
        try {
            // Mostrar loading
            galeriaContainer.innerHTML = `<div class="col-12 text-center">
                                                <div class="spinner-border text-primary" role="status">
                                                    <span class="visually-hidden">Carregando...</span>
                                                </div>
                                            </div>`;

            // Buscar fotos no Supabase
            const { data, error } = await supabase
                .from('galeria_fotos')
                .select('*')
                .order('criado_em', { ascending: false });

            if (error) throw error;

            // Limpar container
            galeriaContainer.innerHTML = '';

            if (data.length === 0) {
                galeriaContainer.innerHTML = '<div class="col-12 text-center text-muted py-4">Nenhuma foto encontrada.</div>';
                return;
            }

            // Exibir fotos
            data.forEach(foto => {
                const fotoElement = createPhotoCard(foto);
                galeriaContainer.appendChild(fotoElement);
            });

        } catch (error) {
            console.error('Erro ao carregar galeria:', error);
            galeriaContainer.innerHTML = '<div class="col-12 text-center text-danger py-4">Erro ao carregar fotos. Tente novamente.</div>';
        }
    }

    // Criar card de foto
    function createPhotoCard(foto) {
        const col = document.createElement('div');
        col.className = 'col-md-4 col-lg-3';

        col.innerHTML = `
            <div class="card gallery-card">
                <img src="${foto.url_imagem}" class="card-img-top" alt="${foto.descricao || 'Foto'}">
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between">
                        <small class="text-muted">${formatDate(foto.criado_em)}</small>
                        <!-- <small class="badge bg-secondary">${foto.categoria}</small> -->
                    </div>
                    <p class="card-text small text-truncate mb-1" title="${foto.descricao || ''}">${foto.descricao || 'Sem descrição'}</p>
                    <div class="d-flex justify-content-end gap-1">
                        <button class="btn btn-sm btn-outline-primary view-btn" data-id="${foto.id}">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${foto.id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Adicionar eventos aos botões
        col.querySelector('.view-btn').addEventListener('click', () => viewImage(foto));
        col.querySelector('.delete-btn').addEventListener('click', () => confirmDelete(foto.id));

        return col;
    }

    // Visualizar foto em modal
    function viewImage(foto) {
        document.getElementById('modalImage').src = foto.url_imagem;
        document.getElementById('imageDescription').textContent = foto.descricao || 'Sem descrição';
        // document.getElementById('imageCategory').textContent = foto.categoria;
        document.getElementById('imageDate').textContent = formatDate(foto.criado_em);
        currentImageId = foto.id;

        const modal = new bootstrap.Modal(document.getElementById('viewImageModal'));
        modal.show();
    }

    // Confirmar exclusão de foto
    function confirmDelete(id) {
        if (confirm('Tem certeza que deseja excluir esta foto?')) {
            deleteImage(id);
        }
    }

    // Excluir foto
    async function deleteImage(id) {
        try {
            // Buscar a foto para obter o nome do arquivo no storage
            const { data: foto, error: fetchError } = await supabase
                .from('galeria_fotos')
                .select('url_imagem, nome_arquivo')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            const urlParts = foto.url_imagem.split('/');
            const fileName = urlParts[urlParts.length - 1];

            // Excluir do storage
            const { error: deleteError } = await supabase
                .storage
                .from('galeria')
                .remove([fileName]);

            if (deleteError) throw deleteError;

            // Excluir do banco de dados
            const { error } = await supabase
                .from('galeria_fotos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Recarregar galeria
            loadGallery();

            // Fechar modal se estiver aberto
            if (currentImageId === id) {
                const modal = bootstrap.Modal.getInstance(document.getElementById('viewImageModal'));
                if (modal) modal.hide();
            }

            alert('Foto excluída com sucesso!');

        } catch (error) {
            console.error('Erro ao excluir foto:', error);
            alert('Erro ao excluir foto. Tente novamente.');
        }
    }

    // Configurar event listeners para upload
    function setupEventListeners() {
        // Selecionar arquivos
        if (selectFilesBtn) selectFilesBtn.addEventListener('click', () => fileInput.click());

        // Quando arquivos são selecionados
        if (fileInput) fileInput.addEventListener('change', handleFileSelect);

        // Drag and drop
        if (dropArea) {
            dropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropArea.classList.add('border-primary', 'bg-light');
            });

            dropArea.addEventListener('dragleave', () => {
                dropArea.classList.remove('border-primary', 'bg-light');
            });

            dropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dropArea.classList.remove('border-primary', 'bg-light');
                fileInput.files = e.dataTransfer.files;
                handleFileSelect({ target: fileInput });
            });
        }

        // Botão de confirmar upload
        if (confirmUpload) confirmUpload.addEventListener('click', uploadFiles);

        // Botão de excluir no modal
        const deleteBtn = document.getElementById('deleteImageBtn')
        if (!deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (currentImageId) {
                    confirmDelete(currentImageId);
                }
            });
        };
    }

    // Manipular seleção de arquivos
    function handleFileSelect(event) {
        selectedFiles = Array.from(event.target.files);

        if (selectedFiles.length === 0) return;

        // Limpar preview anterior
        previewContainer.innerHTML = '';

        // Exibir preview das imagens
        selectedFiles.forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'col-6 col-md-4 col-lg-3';
                imgContainer.innerHTML = `
                    <div class="position-relative">
                        <img src="${e.target.result}" class="img-thumbnail" alt="Preview">
                        <button class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 remove-btn" data-index="${index}">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                `;
                previewContainer.appendChild(imgContainer);

                // Adicionar evento ao botão de remover
                imgContainer.querySelector('.remove-btn').addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    removeFile(index);
                });
            };
            reader.readAsDataURL(file);
        });

        // Mostrar área de preview
        uploadPreview.classList.remove('d-none');
        confirmUpload.disabled = false;
    }

    // Remover arquivo da seleção
    function removeFile(index) {
        selectedFiles.splice(index, 1);

        // Recriar o preview
        if (selectedFiles.length > 0) {
            const dataTransfer = new DataTransfer();
            selectedFiles.forEach(file => dataTransfer.items.add(file));
            fileInput.files = dataTransfer.files;
            handleFileSelect({ target: fileInput });
        } else {
            previewContainer.innerHTML = '';
            uploadPreview.classList.add('d-none');
            confirmUpload.disabled = true;
            fileInput.value = '';
        }
    }

    // Upload de arquivos
    async function uploadFiles() {
    if (selectedFiles.length === 0) return;

    const descricao = document.getElementById('imageDescription').value || '';

    confirmUpload.disabled = true;
    confirmUpload.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

    try {
        const uploadResults = [];

        for (const file of selectedFiles) {
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${file.name}`;

            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('galeria')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase
                .storage
                .from('galeria')
                .getPublicUrl(fileName);

            const { data: dbData, error: dbError } = await supabase
                .from('galeria_fotos')
                .insert([{
                    url_imagem: urlData.publicUrl, // ajustado para url_imagem
                    nome_arquivo: fileName,
                    descricao: descricao,           // descrição capturada do input
                    criado_em: new Date().toISOString()
                }])
                .select();

            if (dbError) throw dbError;

            uploadResults.push(dbData[0]);
        }

        await loadGallery();

        selectedFiles = [];
        fileInput.value = '';
        previewContainer.innerHTML = '';
        uploadPreview.classList.add('d-none');

        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadModal'));
        modal.hide();

        alert(`${uploadResults.length} foto(s) enviada(s) com sucesso!`);

    } catch (error) {
        console.error('Erro no upload:', error);
        alert('Erro ao enviar fotos. Tente novamente.');
    } finally {
        confirmUpload.disabled = false;
        confirmUpload.innerHTML = 'Enviar Fotos';
    }
}


    // Formatar data
    function formatDate(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    }
});