const supabase = window.supabase;

document.addEventListener('DOMContentLoaded', () => {
    carregarCarrosselSite();
});

async function carregarCarrosselSite() {
    const { data, error } = await supabase
        .from('carrossel_noticias')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao carregar carrossel:', error);
        return;
    }

    const inner = document.getElementById('carousel-inner');
    const indicatorsContainer = document.getElementById('carousel-indicators');
    inner.innerHTML = '';
    indicatorsContainer.innerHTML = '';

    data.forEach((item, index) => {
        // Criar slide
        const slide = document.createElement('div');
        slide.className = `carousel-item${index === 0 ? ' active' : ''}`;
        slide.innerHTML = `
            <img src="${item.imagem_url}" alt="${item.titulo}" class="carousel-image">
            <div class="carousel-caption">
                <h3>${item.categoria.toUpperCase()}</h3>
                <p>${item.titulo}</p>
                ${item.link_url ? `<a href="${item.link_url}" class="btnn">${item.link_texto || 'Saiba mais'}</a>` : ''}
            </div>
        `;
        inner.appendChild(slide);

        // Criar indicador
        const indicator = document.createElement('button');
        indicator.className = `indicator${index === 0 ? ' active' : ''}`;
        indicator.setAttribute('data-slide-to', index);
        indicatorsContainer.appendChild(indicator);
    });

    // Agora que o HTML foi gerado, inicializar o carrossel
    inicializarCarrossel();
}

function inicializarCarrossel() {
    const items = document.querySelectorAll('.carousel-item');
    const indicators = document.querySelectorAll('.indicator');
    const prev = document.querySelector('.carousel-control.prev');
    const next = document.querySelector('.carousel-control.next');
    let currentIndex = 0;

    function showSlide(index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        indicators.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
    }

    prev.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showSlide(currentIndex);
    });

    next.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % items.length;
        showSlide(currentIndex);
    });

    indicators.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            currentIndex = i;
            showSlide(currentIndex);
        });
    });

    // Slide automático
    setInterval(() => {
        currentIndex = (currentIndex + 1) % items.length;
        showSlide(currentIndex);
    }, 6000);
}
