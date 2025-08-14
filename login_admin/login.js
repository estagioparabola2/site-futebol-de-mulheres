supabase = window.supabase;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Verificar credenciais
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('senha', password) // Na prática, compare hashes
            .single();
        
        if (error || !data) throw new Error('Credenciais inválidas');
        
        // Atualizar último login
        await supabase
            .from('usuarios')
            .update({ ultimo_login: new Date() })
            .eq('id', data.id);
        
        // alert('Login realizado com sucesso!');
        // Redirecionar para área logada
        window.location.href = '../admin/painel.html';
    } catch (error) {
        console.error('Erro no login:', error.message);
        alert('Erro ao fazer login: ' + error.message);
    }
});