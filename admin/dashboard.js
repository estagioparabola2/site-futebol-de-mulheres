const supabase = window.supabase;

document.addEventListener("DOMContentLoaded", async () => {
    await CarregaEstatisticas();
    await CarregaAtividadesRecentes();
    await inicializaMenu();
});

// Sidebar toggle functionality
async function inicializaMenu() {
    const sidebar = document.getElementById('sidebar')
    const main = document.getElementById('maincontent');
    const abrirMenu = document.getElementById('menuToggle');
    const fecharMenu = document.getElementById('fecharToggle');

    if (abrirMenu) {
        abrirMenu.addEventListener('click', () => {
            sidebar.classList.add('active');
            main.classList.add('active');
        });
    }

    if (fecharMenu) {
        fecharMenu.addEventListener('click', () => {
            sidebar.classList.remove('active');
            main.classList.remove('active');
        });
    }
    
};

const CarregaEstatisticas = async () => {
    // ler todas as linhas da tabela artigos
    const { count: artigosCount } = await supabase
        .from('artigos')
        .select('*', { count: 'exact', head: true });
    document.getElementById('total-artigos').textContent = artigosCount || 0;

    //ler todas as linhas da tabela eventos
    const { count: eventosCount } = await supabase
        .from('eventos')
        .select('*', { count: 'exact', head: true });
    document.getElementById('total-eventos').textContent = eventosCount || 0;

    // ler todas as linhas da tabela fotos
    const { count: fotosCount } = await supabase
        .from('galeria_fotos')
        .select('*', { count: 'exact', head: true });
    document.getElementById('total-fotos').textContent = fotosCount || 0;

    // ler todas as linhas da tabela artigos do estados
    const { count: estadosCount } = await supabase
        .from('artigos_estado')
        .select('*', { count: 'exact', head: true });
    document.getElementById('total-estados').textContent = estadosCount || 0;
}

const CarregaAtividadesRecentes = async () => {
    const activityList = document.getElementById('recent-activity');

    // Buscar atividades recentes de todas as tabelas
    const { data: artigos } = await supabase
        .from('artigos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

    const { data: eventos } = await supabase
        .from('eventos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

    const { data: estados } = await supabase
        .from('artigos_estado')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

    // Combinar e ordenar todas as atividades
    const allActivities = [
        ...artigos.map(artigo => ({ ...artigo, type: 'artigo' })),
        ...eventos.map(evento => ({ ...evento, type: 'evento' })),
        ...estados.map(estado => ({ ...estado, type: 'artigos_estado' }))
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Renderizar atividades
    activityList.innerHTML = '';
    allActivities.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.classListName = 'activity-item';

        activityItem.innerHTML = `
            <div classe= "activity-icon">
                <i classe=" bi bi-${activity.type === 'Artigo' ? 'newspaper' :
                activity.type === 'Evento' ? 'calendar-event' : 'info-circle'}"></i>
            </div>
            <div class="activity-details">
                <strong>${activity.type}: ${activity.titulo}</strong>
                <div class="activity-time">${new Date(activity.created_at).toLocaleString()}</div>
            </div>
        `;
        activityList.appendChild(activityItem);
    })
}