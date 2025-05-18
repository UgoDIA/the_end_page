document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const postsGrid = document.querySelector('.posts-grid');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const sortButtons = document.querySelectorAll('.sort-options .pill-btn');
    const toneButtons = document.querySelectorAll('.tone-filters .pill-btn');
    const toastContainer = document.querySelector('.toast-container');

    // État
    let currentPage = 1;
    let isLoading = false;
    let currentSort = 'trending';
    let currentTone = null;
    let allPosts = [];

    // Propriétés de ton disponibles
    const tones = ['classy', 'rage', 'cringe', 'touching'];
    const subreddits = ['actualites', 'technologie', 'humour', 'science'];
    const titles = [
        "Un départ inoubliable !", "La technologie change tout", "Un moment de rage", "Une histoire touchante", "Cringe du jour", "Classe ultime", "Science et avenir", "Humour garanti", "Récit absurde", "Un adieu émouvant"
    ];
    const excerpts = [
        "Voici un extrait de la page pour donner envie de cliquer…",
        "Un résumé bref et accrocheur pour illustrer le contenu.",
        "Découvrez pourquoi cette page fait le buzz !",
        "Une anecdote qui ne laisse personne indifférent.",
        "Un ton unique pour une page unique.",
        "À lire absolument pour comprendre la tendance."
    ];

    // Générer des pages aléatoires
    function generateRandomPosts(count = 30) {
        const posts = [];
        for (let i = 0; i < count; i++) {
            const tone = tones[Math.floor(Math.random() * tones.length)];
            const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
            const title = titles[Math.floor(Math.random() * titles.length)];
            const excerpt = excerpts[Math.floor(Math.random() * excerpts.length)];
            const likes = Math.floor(Math.random() * 300);
            const hours = Math.floor(Math.random() * 24);
            const isTrending = likes > 100 && hours <= 1;
            posts.push({
                id: i + 1,
                username: `utilisateur${i + 1}`,
                avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${i + 1}`,
                subreddit,
                title,
                excerpt,
                likes,
                time: `${hours}h`,
                isTrending,
                tone
            });
        }
        return posts;
    }

    // Initialisation des posts
    allPosts = generateRandomPosts(50);

    // Gestion des likes
    document.addEventListener('click', function(e) {
        if (e.target.closest('.like-btn')) {
            const likeBtn = e.target.closest('.like-btn');
            const likeCount = likeBtn.querySelector('.like-count');
            const icon = likeBtn.querySelector('i');
            const isLiked = likeBtn.classList.contains('liked');
            // Optimistic UI
            likeBtn.classList.toggle('liked');
            likeBtn.setAttribute('aria-pressed', !isLiked);
            icon.className = !isLiked ? 'fas fa-heart' : 'far fa-heart';
            likeCount.textContent = parseInt(likeCount.textContent) + (isLiked ? -1 : 1);
            likeBtn.style.animation = 'pop 0.2s';
            setTimeout(() => { likeBtn.style.animation = ''; }, 200);
            showToast(!isLiked ? '+1 like !' : '-1 like');
            simulateLikeAPI(likeBtn.dataset.postId, !isLiked);
        }
    });

    // Gestion du tri
    sortButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            refreshPosts();
        });
    });

    // Gestion des filtres de ton
    toneButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.classList.contains('active')) {
                this.classList.remove('active');
                currentTone = null;
            } else {
                toneButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentTone = this.dataset.tone;
            }
            refreshPosts();
        });
    });

    // Chargement infini
    let observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                loadMorePosts();
            }
        });
    });

    observer.observe(loadMoreBtn);

    // Fonctions utilitaires
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 1500);
        }, 1500);
    }

    function simulateLikeAPI(postId, liked) {
        setTimeout(() => {
            // Simule l'appel réseau
        }, 500);
    }

    function refreshPosts() {
        currentPage = 1;
        postsGrid.innerHTML = '';
        loadMorePosts();
    }

    function loadMorePosts() {
        if (isLoading) return;
        isLoading = true;

        // Afficher le skeleton loader
        const skeleton = createSkeletonLoader();
        postsGrid.appendChild(skeleton);

        setTimeout(() => {
            skeleton.remove();
            loadPosts(currentPage);
            currentPage++;
            isLoading = false;
        }, 700);
    }

    function createSkeletonLoader() {
        const skeleton = document.createElement('div');
        skeleton.className = 'post-skeleton';
        skeleton.innerHTML = `
            <div class="skeleton-header">
                <div class="skeleton-avatar"></div>
                <div class="skeleton-text"></div>
            </div>
            <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-excerpt"></div>
            </div>
        `;
        return skeleton;
    }

    function loadPosts(page) {
        // Pagination : 8 posts par page
        let filtered = allPosts.slice();
        if (currentTone) {
            filtered = filtered.filter(post => post.tone === currentTone);
        }
        if (currentSort === 'trending') {
            filtered = filtered.sort((a, b) => b.likes - a.likes);
        } else if (currentSort === 'recent') {
            // Trier par heure croissante (0h, 1h, ...)
            filtered = filtered.sort((a, b) => parseInt(a.time) - parseInt(b.time));
        } else if (currentSort === 'recommended') {
            filtered = filtered.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
        }
        const start = (page - 1) * 8;
        const end = start + 8;
        const posts = filtered.slice(start, end);
        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsGrid.appendChild(postElement);
        });
    }

    function createPostElement(post) {
        const article = document.createElement('article');
        article.className = 'post-card';
        // Heure sans double 'h'
        const heure = post.time.toString().replace(/h+$/, '') + 'h';
        // Actions bar (uniquement le bouton like)
        const actionsBar = `
            <div class="actions-bar">
                <button class="action-icon like-btn" data-liked="false" data-post-id="${post.id}" aria-pressed="false">
                    <i class="fa${post.liked ? 's' : 'r'} fa-heart"></i>
                    <span class="like-count">${post.likes}</span>
                    <span class="tooltip">J'aime</span>
                </button>
            </div>`;
        article.innerHTML = `
            <div class="post-content">
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">par <strong>${post.username}</strong> • r/${post.subreddit} • ${heure}</div>
                <p class="post-excerpt">${post.excerpt}</p>
            </div>
            ${actionsBar}
        `;
        return article;
    }

    function capitalizeTone(tone) {
        return tone.charAt(0).toUpperCase() + tone.slice(1);
    }

    // Initialisation
    refreshPosts();
}); 