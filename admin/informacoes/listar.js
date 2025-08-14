document.addEventListener('DOMContentLoaded', async () => {
    await carregarArtigos();
    
    // Configurar o formulário
    document.getElementById('salvar').addEventListener('click', salvarArtigo);
});

async function carregarArtigos() {
    const tableBody = document.getElementById('artigosEstado-table');
    tableBody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    const { data, error } = await supabase
        .from('artigos_estado')
        .select(`
            id,
            titulo,
            estado_uf,
            tipo_pesquisa,
            data_publicacao
        `)
        .order('data_publicacao', { ascending: false });

    if (error) {
        console.error('Erro ao carregar artigos:', error);
        return;
    }

    const tbody = document.querySelector('#tabelaNoticias tbody');
    tbody.innerHTML = '';

    data.forEach(artigo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${artigo.titulo}</td>
            <td>${artigo.estado_uf}</td>
            <td>${artigo.tipo_pesquisa}</td>
            <td>
                <span class="badge ${artigo.status === 'publicado' ? 'bg-success' : 'bg-secondary'}">
                    ${artigo.status}
                </span>
            </td>
            <td>${new Date(artigo.data_publicacao).toLocaleDateString()}</td>
            <td>
            
                <a href="../informacoes/editar.html?id=${artigo.id}" class="btn btn-sm btn-primary me-1">
                    <i class="bi bi-pencil"></i>
                </a>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirArtigo('${artigo.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function salvarArtigo() {
    // Validar campos obrigatórios
    if (!validarFormulario()) return;

    const formData = {
        titulo: document.getElementById('titulo').value,
        estado_uf: document.getElementById('estado').value,
        autores: document.getElementById('autores').value,
        instituto: document.getElementById('instituto').value,
        tipo_pesquisa: document.getElementById('tipoPesquisa').value,
        url_doi: document.getElementById('url').value,
        data_publicacao: document.getElementById('dataPublicacao').value || new Date().toISOString(),
    };

    // Upload da imagem se existir
    const fileInput = document.getElementById('imagemCapa');
    if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileName = `artigos/${Date.now()}-${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('artigos-imagens')
            .upload(fileName, file);

        if (uploadError) {
            console.error('Erro no upload:', uploadError);
            alert('Erro ao enviar imagem');
            return;
        }
        
        formData.imagem_capa = fileName;
    }

    // Inserir no banco de dados
    const { data, error } = await supabase
        .from('artigos_estado')
        .insert([formData]);

    if (error) {
        console.error('Erro ao salvar artigo:', error);
        alert('Erro ao salvar artigo');
    } else {
        alert('Artigo salvo com sucesso!');
        carregarArtigos();
        bootstrap.Modal.getInstance(document.getElementById('novaNoticiaModal')).hide();
    }
}

function validarFormulario() {
    const camposObrigatorios = ['titulo', 'estado', 'autores', 'instituto'];
    let valido = true;
    
    camposObrigatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (!campo.value.trim()) {
            campo.classList.add('is-invalid');
            valido = false;
        } else {
            campo.classList.remove('is-invalid');
        }
    });
    
    return valido;
}

async function excluirArtigo(id) {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    
    const { error } = await supabase
        .from('artigos_estado')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir artigo');
    } else {
        carregarArtigos();
    }
}