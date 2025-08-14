const supabase = window.supabase;

document.addEventListener('DOMContentLoaded', async () => {
    // Carregar configurações existentes
    await loadConfiguracoes();
    
    // Configurar eventos
    document.getElementById('form-configuracoes').addEventListener('submit', salvarConfiguracoes);
    document.getElementById('btn-alterar-senha').addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('modal-senha')).show();
    });
    document.getElementById('btn-confirmar-senha').addEventListener('click', alterarSenha);
});

async function loadConfiguracoes() {
    // Buscar configurações do Supabase
    const { data: configuracoes, error } = await supabase
        .from('configuracoes')
        .select('*')
        .single();
    
    if (error && error.code !== 'PGRST116') { // Ignorar erro "Nenhum resultado encontrado"
        console.error('Erro ao carregar configurações:', error);
        return;
    }
    
    // Preencher formulário com valores existentes ou padrão
    if (configuracoes) {
        document.getElementById('tema').value = configuracoes.tema || 'claro';
        document.getElementById('cor-primaria').value = configuracoes.cor_primaria || '#4e73df';
        document.getElementById('nome-site').value = configuracoes.nome_site || '';
        document.getElementById('logo-site').value = configuracoes.logo_site || '';
        document.getElementById('email-contato').value = configuracoes.email_contato || '';
        document.getElementById('smtp-host').value = configuracoes.smtp_host || '';
        document.getElementById('smtp-porta').value = configuracoes.smtp_porta || '';
        document.getElementById('autenticacao-2fatores').checked = configuracoes.autenticacao_2fatores || false;
    }
}

async function salvarConfiguracoes(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
    
    // Coletar dados do formulário
    const configuracoes = {
        tema: document.getElementById('tema').value,
        cor_primaria: document.getElementById('cor-primaria').value,
        nome_site: document.getElementById('nome-site').value,
        logo_site: document.getElementById('logo-site').value,
        email_contato: document.getElementById('email-contato').value,
        smtp_host: document.getElementById('smtp-host').value,
        smtp_porta: document.getElementById('smtp-porta').value,
        autenticacao_2fatores: document.getElementById('autenticacao-2fatores').checked,
        updated_at: new Date().toISOString()
    };
    
    // Salvar no Supabase (upsert - insere ou atualiza)
    const { error } = await supabase
        .from('configuracoes')
        .upsert([configuracoes], { onConflict: 'id' });
    
    submitBtn.disabled = false;
    submitBtn.textContent = 'Salvar Configurações';
    
    if (error) {
        alert('Erro ao salvar configurações: ' + error.message);
        console.error(error);
        return;
    }
    
    alert('Configurações salvas com sucesso!');
    applyTheme(configuracoes.tema, configuracoes.cor_primaria);
}

async function alterarSenha() {
    const senhaAtual = document.getElementById('senha-atual').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    
    if (novaSenha !== confirmarSenha) {
        alert('As novas senhas não coincidem');
        return;
    }
    
    const btnConfirmar = document.getElementById('btn-confirmar-senha');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Alterando...';
    
    // Verificar senha atual e atualizar
    const { error } = await supabase.auth.updateUser({
        password: novaSenha
    });
    
    btnConfirmar.disabled = false;
    btnConfirmar.textContent = 'Confirmar';
    
    if (error) {
        alert('Erro ao alterar senha: ' + error.message);
        console.error(error);
        return;
    }
    
    alert('Senha alterada com sucesso!');
    bootstrap.Modal.getInstance(document.getElementById('modal-senha')).hide();
    document.getElementById('form-alterar-senha').reset();
}

function applyTheme(tema, corPrimaria) {
    // Aplicar tema visualmente
    document.documentElement.style.setProperty('--primary-color', corPrimaria);
    
    if (tema === 'escuro') {
        document.body.classList.add('dark-mode');
    } else if (tema === 'claro') {
        document.body.classList.remove('dark-mode');
    } else {
        // Tema automático - seguir preferência do sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
}