const supabase = window.supabase;


let estadoId;

document.addEventListener('DOMContentLoaded', async () => {
    // Obter ID do evento da URL
    const urlParams = new URLSearchParams(window.location.search);
    estadoId = urlParams.get('id');

    if (!estadoId) {
        window.location.href = 'listar.html';
        return;
    }

    // Carregar dados do estado
    await carregarEstado(estadoId);

    // Configurar formulário
    document.getElementById('form-estado').addEventListener('submit', enviarFormulario);
    document.getElementById('salvar').addEventListener('click', enviarFormulario);
    

    // Botão de cancelar
    document.getElementById('btn-cancelar').addEventListener('click', () => {
        window.location.href = '../informacoes/listar.html';
    });
});

// Carregar dados do estado
async function carregarEstado(id) {
    const { data: estado, error } = await supabase
        .from('artigos_estado')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !estado) {
        alert('Eestado não encontrado');
        window.location.href = '../informacoes/listar.html';
        return;
    }

    // Preencher formulário
    document.getElementById('titulo').value = estado.titulo;
    document.getElementById('estado').value = estado.estado_uf;
    document.getElementById('autores').value = estado.autores;
    document.getElementById('instituto').value = estado.instituto;
    document.getElementById('tipoPesquisa').value = estado.tipo_pesquisa;
    document.getElementById('url').value = estado.url_doi;
    // document.getElementById('status').value = estado.status;
    document.getElementById('dataPublicacao').value = estado.data_publicacao || new Date().toISOString();
}

async function enviarFormulario(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('salvar');   
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...';

    // Coletar dados do formulário
    const estado = {
        titulo: document.getElementById('titulo').value,
        estado_uf: document.getElementById('estado').value,
        autores: document.getElementById('autores').value,
        instituto: document.getElementById('instituto').value,
        tipo_pesquisa: document.getElementById('tipoPesquisa').value,
        url_doi: document.getElementById('url').value,
        data_publicacao: document.getElementById('dataPublicacao').value || new Date().toISOString(),
    };

    // Enviar para o Supabase
    const { error } = await supabase
        .from('artigos_estado')
        .update(estado)
        .eq('id', estadoId);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Atualizar estado';

    if (error) {
        alert('Erro ao atualizar estado: ' + error.message);
        console.error(error);
        return;
    }

    alert('Estado atualizado com sucesso!');
    window.location.href = '../informacoes/listar.html';
    // await loadEvento(estadoId);
}

function formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    const pad = num => num.toString().padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}