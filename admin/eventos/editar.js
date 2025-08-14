const supabase = window.supabase;

const scriptUpload = document.createElement('script');
scriptUpload.src = './upload.js';
document.head.appendChild(scriptUpload);

const scriptTags = document.createElement('script');
scriptTags.src = './tags.js';
document.head.appendChild(scriptTags);

let eventoId;

document.addEventListener('DOMContentLoaded', async () => {
    // Obter ID do evento da URL
    const urlParams = new URLSearchParams(window.location.search);
    eventoId = urlParams.get('id');
    
    if (!eventoId) {
        window.location.href = 'listar.html';
        return;
    }
    
    // Carregar dados do evento
    await loadEvento(eventoId);
    
    // Configurar formulário
    document.getElementById('form-evento').addEventListener('submit', handleSubmit);
    document.getElementById('btn-excluir').addEventListener('click', handleDelete);

    // Botão de cancelar
    document.getElementById('btn-cancelar').addEventListener('click', () => {
        if (confirm('Tem certeza que deseja cancelar? Todas as alterações não salvas serão perdidas.')) {
            window.location.href = '../eventos/listar.html';
        }
    });
});

async function loadEvento(id) {
    const { data: evento, error } = await supabase
        .from('eventos')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error || !evento) {
        alert('Evento não encontrado');
        window.location.href = '../eventos/listar.html';
        return;
    }
    
    // Preencher formulário
    document.getElementById('titulo').value = evento.titulo;
    document.getElementById('descricao').value = evento.descricao;
    document.getElementById('data_inicio').value = formatDateTimeLocal(evento.data_inicio);
    document.getElementById('data_fim').value = evento.data_fim ? formatDateTimeLocal(evento.data_fim) : '';
    document.getElementById('local').value = evento.local;
    document.getElementById('endereco').value = evento.endereco || '';
    document.getElementById('imagem').value = evento.imagem || '';
    document.getElementById('status').value = evento.status;
    document.getElementById('link_inscricao').value = evento.link_inscricao || '';
    
    // Pré-visualização da imagem
    if (evento.imagem) {
        const preview = document.getElementById('imagem-preview');
        preview.src = evento.imagem;
        preview.style.display = 'block';
    }
    
    // Preencher tags
    if (evento.categorias && evento.categorias.length > 0) {
        evento.categorias.forEach(tag => addTag(tag));
    }
}

async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Atualizando...';
    
    // Coletar dados do formulário
    const evento = {
        titulo: document.getElementById('titulo').value.trim(),
        descricao: document.getElementById('descricao').value.trim(),
        data_inicio: document.getElementById('data_inicio').value,
        data_fim: document.getElementById('data_fim').value || null,
        local: document.getElementById('local').value.trim(),
        endereco: document.getElementById('endereco').value.trim() || null,
        imagem: document.getElementById('imagem').value || null,
        status: document.getElementById('status').value,
        link_inscricao: document.getElementById('link_inscricao').value.trim() || null,
        categorias: getTags(),
        updated_at: new Date().toISOString()
    };
    
    // Validar dados
    if (!evento.titulo || !evento.descricao || !evento.data_inicio || !evento.local) {
        alert('Preencha todos os campos obrigatórios');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Atualizar Evento';
        return;
    }
    
    // Enviar para o Supabase
    const { error } = await supabase
        .from('eventos')
        .update(evento)
        .eq('id', eventoId);
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Atualizar Evento';
    
    if (error) {
        alert('Erro ao atualizar evento: ' + error.message);
        console.error(error);
        return;
    }
    
    alert('Evento atualizado com sucesso!');
    window.location.href = '../eventos/listar.html';
    // await loadEvento(eventoId);
}

async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este evento permanentemente?')) {
        return;
    }
    
    const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventoId);
    
    if (error) {
        alert('Erro ao excluir evento: ' + error.message);
        console.error(error);
        return;
    }
    
    alert('Evento excluído com sucesso');
    window.location.href = '../eventos/listar.html';
}

function formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    const pad = num => num.toString().padStart(2, '0');
    
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}