const supabase = window.supabase;
let fotos = [];
let filesToUpload = [];

document.addEventListener("DOMContentLoaded", async () => {
    await CarregaGaleriaFotos();
    initUploadModal();
});

// Função para carregar a galeria de fotos
const CarregaGaleriaFotos = async () => {
    const galleryContainer = document.getElementById('gallery-container');
    
    try {
        // Buscar as últimas fotos
        const { data: fotos, error } = await supabase
            .from('galeria_fotos')
            .select('*')
            .order('criado_em', { ascending: false })
            .limit(3);

        if (error) throw error;

        let html = '';
        if (fotos && fotos.length > 0) {
            fotos.forEach(foto => {
                html += `
                    <div class="col-4 col-md-3 mb-3">
                        <div class="gallery-item">
                            <img src="${foto.url_imagem}" alt="${foto.descricao || 'Foto'}" 
                                class="img-fluid rounded" loading="lazy">
                            <small class="d-block text-muted">${formatDate(foto.criado_em)}</small>
                        </div>
                    </div>
                `;
            });
        } else {
            html = '<div class="col-12 text-muted">Nenhuma foto encontrada</div>';
        }

        // Adicionar botão de upload
        html += `
            <div class="col-4 col-md-3 mb-3">
                <div class="gallery-item-placeholder" data-bs-toggle="modal" data-bs-target="#uploadModal">
                    <i class="bi bi-plus-lg"></i>
                    <small>Adicionar</small>
                </div>
            </div>
        `;

        galleryContainer.innerHTML = html;
    } catch (error) {
        console.error('Erro ao carregar galeria:', error);
        galleryContainer.innerHTML = '<div class="col-12 text-danger">Erro ao carregar fotos</div>';
    }
}

// Inicializar modal de upload
function initUploadModal() {
    const modalHTML = `
        <div class="modal fade" id="uploadModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Upload de Fotos</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="border-dashed rounded p-4 text-center" id="dropArea">
                            <i class="bi bi-cloud-arrow-up fs-1 text-primary"></i>
                            <p class="mt-2">Arraste arquivos aqui ou clique para selecionar</p>
                            <input type="file" id="fileUpload" accept="image/*" multiple class="d-none">
                            <button class="btn btn-sm btn-outline-primary mt-2" id="selectFilesBtn">Selecionar Arquivos</button>
                        </div>
                        
                        <div class="mt-3">
                            <div class="mb-3">
                                <label for="imageDescription" class="form-label">Descrição da Imagem</label>
                                <textarea class="form-control" id="imageDescription" rows="2" placeholder="Adicione uma descrição para a imagem"></textarea>
                            </div>
                        </div>
                        
                        <div id="uploadPreview" class="mt-3 d-none">
                            <h6 class="mb-2">Pré-visualização</h6>
                            <div class="row g-2" id="previewContainer"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="confirmUpload" disabled>Enviar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar eventos do modal
    document.getElementById('selectFilesBtn').addEventListener('click', () => {
        document.getElementById('fileUpload').click();
    });
    
    document.getElementById('fileUpload').addEventListener('change', handleFileSelect);
    
    // Configurar área de drop
    setupDropArea();
    
    // Implementar upload para o Supabase Storage
    document.getElementById('confirmUpload').addEventListener('click', uploadFiles);
}

function setupDropArea() {
    const dropArea = document.getElementById('dropArea');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('border-primary');
    }
    
    function unhighlight() {
        dropArea.classList.remove('border-primary');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        document.getElementById('fileUpload').files = files;
        handleFileSelect({ target: document.getElementById('fileUpload') });
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    const previewContainer = document.getElementById('previewContainer');
    const uploadPreview = document.getElementById('uploadPreview');
    const confirmUpload = document.getElementById('confirmUpload');
    
    previewContainer.innerHTML = '';
    
    if (files.length > 0) {
        uploadPreview.classList.remove('d-none');
        confirmUpload.disabled = false;
        
        for (let i = 0; i < Math.min(files.length, 5); i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                previewContainer.innerHTML += `
                    <div class="col-4">
                        <img src="${e.target.result}" class="img-thumbnail" alt="Preview">
                        <small class="d-block text-truncate">${file.name}</small>
                    </div>
                `;
            }
            
            reader.readAsDataURL(file);
        }
    } else {
        uploadPreview.classList.add('d-none');
        confirmUpload.disabled = true;
    }
}

async function uploadFiles() {
    const files = document.getElementById('fileUpload').files;
    const description = document.getElementById('imageDescription').value;
    const confirmUpload = document.getElementById('confirmUpload');
    
    if (files.length === 0) return;
    
    confirmUpload.disabled = true;
    confirmUpload.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
    
    try {
        for (let i = 0; i < files.length; i++) {

            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
            const filePath = `/imagens${fileName}`;
            
            // Upload para o storage
            const { error: uploadError } = await supabase.storage
                .from('galeria')
                .upload(filePath, file);
            
            if (uploadError) throw uploadError;
            
            // Obter URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('galeria')
                .getPublicUrl(filePath);
            
            // Preparar dados para inserção
            const now = new Date().toISOString();
            const photoData = {
                url_imagem: publicUrl,
                nome_arquivo: fileName,
                descricao: description || file.name,
                data_upload: now,
                criado_em: now,
                atualizado_em: now
            };
            
            // Salvar metadados no banco de dados
            const { error: dbError } = await supabase
                .from('galeria_fotos')
                .insert([photoData]);
            
            if (dbError) throw dbError;
        }
        
        // Recarregar a galeria
        await CarregaGaleriaFotos();
        
        // Fechar modal e resetar
        bootstrap.Modal.getInstance(document.getElementById('uploadModal')).hide();
        resetUploadForm();
        
        // Mostrar mensagem de sucesso
        showAlert('Fotos enviadas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro no upload:', error);
        showAlert(`Erro ao enviar fotos: ${error.message}`, 'danger');
    } finally {
        confirmUpload.disabled = false;
        confirmUpload.textContent = 'Enviar';
    }
}

function resetUploadForm() {
    document.getElementById('fileUpload').value = '';
    document.getElementById('imageDescription').value = '';
    document.getElementById('previewContainer').innerHTML = '';
    document.getElementById('uploadPreview').classList.add('d-none');
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show fixed-top m-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
}