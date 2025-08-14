const supabase = window.supabase;

document.addEventListener('DOMContentLoaded', async () => {
    await CarregaArtigos();

    // Configurar o formulário
    document.getElementById('salvar').addEventListener('click', salvarArtigo);
});

async function CarregaArtigos() {
    const tableBody = document.getElementById('artigos-table');
    tableBody.innerHTML = '<tr><td colspan="7">Carregando...</td></tr>';

    const { data: artigos, error } = await supabase
        .from('artigos')
        .select('*')
        .order('data_publicacao', { ascending: false });

    if (error) {
        tableBody.innerHTML = '<tr><td colspan="7">Erro ao carregar artigos</td></tr>';
        console.error(error);
        return;
    }

    if (!artigos || artigos.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7">Nenhum artigo encontrado</td></tr>';
        return;
    }

    tableBody.innerHTML = '';
    artigos.forEach(artigo => {
        const estado = artigo.estado_uf;
        const tipoPesquisa = artigo.tipo_pesquisa || null;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${artigo.titulo}</td>
            <td>${artigo.autor}</td>
            <td>${estado}</td>
            <td>${tipoPesquisa}</td>
            <td>${new Date(artigo.data_publicacao).toLocaleDateString()}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(artigo.status)}">
                    ${artigo.status.charAt(0).toUpperCase() + artigo.status.slice(1)}
                </span>
            </td>
            <td>
                <a href="editar.html?id=${artigo.id}&tipo=geral" class="btn btn-sm btn-primary">
                    <i class="bi bi-pencil"></i>
                </a>
                <button class="btn btn-sm btn-danger">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        row.querySelector('.btn-danger').addEventListener('click', () => {
            deleteArtigo(artigo.id);
        });

        tableBody.appendChild(row);
    });
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'publicado': return 'bg-success';
        case 'rascunho': return 'bg-warning text-dark';
        case 'arquivado': return 'bg-secondary';
        default: return 'bg-light text-dark';
    }
}

async function deleteArtigo(id) {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;

    const { error } = await supabase
        .from('artigos')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Erro ao excluir artigo');
        console.error(error);
        return;
    }

    alert('Artigo excluído com sucesso');
    await CarregaArtigos();
}

async function salvarArtigo() {
    // Validar campos obrigatórios
    if (!validarFormulario()) return;

    const formData = {
        titulo: document.getElementById('titulo').value,
        estado_uf: document.getElementById('estado').value,
        autor: document.getElementById('autores').value,
        descricao: document.getElementById('descricao').value,
        instituto: document.getElementById('instituto').value,
        tipo_pesquisa: document.getElementById('tipoPesquisa').value,
        link_artigo: document.getElementById('url').value,
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
        .from('artigos')
        .insert([formData]);

    if (error) {
        console.error('Erro ao salvar artigo:', error);
        alert('Erro ao salvar artigo');
    } else {
        alert('Artigo salvo com sucesso!');
        CarregaArtigos();
        bootstrap.Modal.getInstance(document.getElementById('novaNoticiaModal')).hide();
    }
}

function validarFormulario() {
    const titulo = document.getElementById('titulo').value.trim();
    const estado = document.getElementById('estado').value.trim();
    const autores = document.getElementById('autores').value.trim();
    const instituto = document.getElementById('instituto').value.trim();
    const tipoPesquisa = document.getElementById('tipoPesquisa').value.trim();

    let erros = [];

    if (!titulo) erros.push('Título');
    if (!estado) erros.push('Estado');
    if (!autores) erros.push('Autores');
    if (!instituto) erros.push('Instituto');
    if (!tipoPesquisa) erros.push('Tipo de Pesquisa');

    if (erros.length > 0) {
        console.warn("Campos obrigatórios faltando:", erros.join(', '));
        return false; // Falhou na validação
    }

    return true; // Passou
}
