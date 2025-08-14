supabase = window.supabase;

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const recoveryPhrase = document.getElementById('recoveryPhrase').value;
    
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .insert([
                { 
                    nome: name, 
                    email: email, 
                    senha: password, // Na prática, você deve usar hash antes de enviar
                    palavra_chave: recoveryPhrase 
                }
            ])
            .select();
        
        if (error) throw error;
        
        alert('Cadastro realizado com sucesso!');
        window.location.href = '../admin/painel.html';
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        alert('Erro ao cadastrar: ' + error.message);
    }
});