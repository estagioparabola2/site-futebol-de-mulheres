const supabase = window.supabase;

// assets/js/admin/eventos/tags.js
const tagsContainer = document.getElementById('tags-container');
const tagInput = document.getElementById('tag-input');

tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const tag = tagInput.value.trim();
        if (tag) {
            addTag(tag);
            tagInput.value = '';
        }
    }
});

function addTag(tag) {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.innerHTML = `
    ${tag}
    <span class="tag-remove" data-tag="${tag}">&times;</span>
  `;
    tagsContainer.appendChild(tagElement);

    // Adicionar evento de remoção
    tagElement.querySelector('.tag-remove').addEventListener('click', (e) => {
        e.target.parentElement.remove();
    });
}

// Para salvar no formulário
function getTags() {
    return Array.from(document.querySelectorAll('.tag'))
        .map(tag => tag.textContent.trim().replace('×', ''));
}