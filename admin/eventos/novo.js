const supabase = window.supabase;

const scriptUpload = document.createElement('script');
scriptUpload.src = './upload.js';
document.head.appendChild(scriptUpload);

const scriptTags = document.createElement('script');
scriptTags.src = './tags.js';
document.head.appendChild(scriptTags);

document.addEventListener('DOMContentLoaded', () => {
    // Configurar data/hora padrão (agora + 1 hora)
    const now = new Date();
    now.setHours(now.getHours() + 1);
    
    const startDate = now.toISOString().slice(0, 16);
    document.getElementById('data_inicio').value = startDate;
    
    // Configurar formulário
    document.getElementById('form-evento').addEventListener('submit', handleSubmit);
});

async function handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
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
        categorias: getTags()
    };
    
    // Validar dados
    if (!evento.titulo || !evento.descricao || !evento.data_inicio || !evento.local) {
        alert('Preencha todos os campos obrigatórios');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar Evento';
        return;
    }
    
    // Enviar para o Supabase
    const { data, error } = await supabase
        .from('eventos')
        .insert([evento])
        .select();
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Evento';
    
    if (error) {
        alert('Erro ao salvar evento: ' + error.message);
        console.error(error);
        return;
    }
    
    alert('Evento criado com sucesso!');
    // window.location.href = `editar.html?id=${data[0].id}`;
    window.location.href = `../eventos/listar.html`;
}

function getTags() {
    const tags = Array.from(document.querySelectorAll('.tag'))
        .map(tag => tag.textContent.trim().replace('×', ''));
    return tags.length > 0 ? tags : null;
}