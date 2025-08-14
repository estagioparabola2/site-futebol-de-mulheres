// const supabase = window.supabase;

document.getElementById('btn-upload').addEventListener('click', () => {
    document.getElementById('imagem-upload').click();
});

document.getElementById('imagem-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Mostrar pré-visualização
    const preview = document.getElementById('imagem-preview');
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';

    // Upload para Supabase Storage
    const filePath = `/eventos${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase
        .storage
        .from('eventos')
        .upload(filePath, file);

    if (error) {
        console.error('Upload error:', error.message);
        return;
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
        .from('eventos')
        .getPublicUrl(filePath);

    document.getElementById('imagem').value = publicUrl;

    console.log('Imagem enviada para:', publicUrl);
});