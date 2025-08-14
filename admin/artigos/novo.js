const supabase = window.supabase;

document.addEventListener('DOMContentLoaded', () => {
    // Definir data atual como padrão
    document.getElementById('data_publicacao').valueAsDate = new Date();
    
    // Formulário de submissão
    document.getElementById('form-artigo').addEventListener('submit', async (e) => {
        e.preventDefault();
        await SalvarArtigo();
    });
});

async function SalvarArtigo() {
    const form = document.getElementById('form-artigo');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
        
        const artigo = {
            titulo: document.getElementById('titulo').value,
            instituto: document.getElementById('instituto').value,
            tipo_pesquisa: document.getElementById('tipoPesquisa').value,
            resumo: document.getElementById('resumo').value,
            descricao: document.getElementById('descricao').value,
            autor: document.getElementById('autor').value,
            data_publicacao: document.getElementById('data_publicacao').value,
            link_artigo: document.getElementById('link_artigo').value || null,
            status: document.getElementById('status').value
        };
        
        // Verifica se todos os campos obrigatórios estão preenchidos
        if (!artigo.titulo || !artigo.autor) {
            throw new Error('Preencha todos os campos obrigatórios');
        }
        
        const { data, error } = await supabase
            .from('artigos')
            .insert([artigo])
            .select();
        
        if (error) throw error;
        
        alert('Artigo salvo com sucesso!');
        window.location.href = `../../admin/artigos/listar.html?id=${data[0].id}`;
        console.log('Dados a serem enviados:', artigo);
        
    } catch (error) {
        console.error('Erro ao salvar artigo:', error);
        alert('Erro ao salvar artigo: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Salvar Artigo';
    }

    // console.log('Cliente Supabase:', supabase);
}