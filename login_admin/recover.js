supabase = window.supabase;

let recoveryStep = 1; // 1 = verificação, 2 = nova senha
let userId = null;

document.getElementById('recoverForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const recoveryPhrase = document.getElementById('recoveryPhrase').value;
    
    if (recoveryStep === 1) {
        try {
            // Verificar e-mail e palavra-chave
            const { data, error } = await supabase
                .from('usuarios')
                .select('id')
                .eq('email', email)
                .eq('palavra_chave', recoveryPhrase)
                .single();
            
            if (error || !data) throw new Error('E-mail ou palavra-chave incorretos');
            
            userId = data.id;
            
            // Mostrar campo para nova senha
            document.getElementById('newPasswordGroup').style.display = 'block';
            document.getElementById('submitBtn').textContent = 'Redefinir Senha';
            recoveryStep = 2;
            
        } catch (error) {
            console.error('Erro na recuperação:', error.message);
            alert('Erro: ' + error.message);
        }
    } else {
        // Atualizar senha
        const newPassword = document.getElementById('newPassword').value;
        
        try {
            const { error } = await supabase
                .from('usuarios')
                .update({ senha: newPassword })
                .eq('id', userId);
            
            if (error) throw error;
            
            alert('Senha redefinida com sucesso!');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Erro ao redefinir senha:', error.message);
            alert('Erro ao redefinir senha: ' + error.message);
        }
    }
});