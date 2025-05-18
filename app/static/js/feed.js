document.addEventListener('DOMContentLoaded', function () {
    // Éléments DOM
    const postsGrid = document.querySelector('.posts-grid');
    const loadMoreBtn = document.querySelector('.load-more-btn');
    const sortButtons = document.querySelectorAll('.sort-options .pill-btn');
    const toneButtons = document.querySelectorAll('.tone-filters .pill-btn');
    const toastContainer = document.querySelector('.toast-container');

    // État
    let currentPage = 1;
    let isLoading = false;
    let currentSort = 'trending';  // Default to trending (most liked)
    let currentTone = null;
    let hasMore = true;

    // Get liked posts from localStorage
    function getLikedPosts() {
        const likedPosts = localStorage.getItem('likedPosts');
        return likedPosts ? JSON.parse(likedPosts) : [];
    }

    // Save liked post to localStorage
    function saveLikedPost(slug, isLiked) {
        const likedPosts = getLikedPosts();
        if (isLiked) {
            if (!likedPosts.includes(slug)) {
                likedPosts.push(slug);
            }
        } else {
            const index = likedPosts.indexOf(slug);
            if (index > -1) {
                likedPosts.splice(index, 1);
            }
        }
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    }

    // Check if a post is liked
    function isPostLiked(slug) {
        return getLikedPosts().includes(slug);
    }

    // Gestion des likes
    document.addEventListener('click', async function (e) {
        if (e.target.closest('.like-btn')) {
            const likeBtn = e.target.closest('.like-btn');
            const likeCount = likeBtn.querySelector('.like-count');
            const icon = likeBtn.querySelector('i');
            const pageSlug = likeBtn.dataset.pageSlug;
            const isLiked = isPostLiked(pageSlug);

            try {
                // Optimistic UI update
                likeBtn.classList.toggle('liked');
                likeBtn.setAttribute('aria-pressed', !isLiked);
                icon.className = !isLiked ? 'fas fa-heart' : 'far fa-heart';

                // Make API call
                const response = await fetch(`/api/page/${pageSlug}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: isLiked ? 'unlike' : 'like'
                    })
                });

                const data = await response.json();
                console.log('Like API response:', data);

                if (data.status === 'success') {
                    // Update the like count with the actual value from the server
                    likeCount.textContent = data.likes;
                    likeBtn.style.animation = 'pop 0.2s';
                    setTimeout(() => { likeBtn.style.animation = ''; }, 200);
                    showToast(!isLiked ? '+1 like !' : '-1 like');

                    // Save to localStorage
                    saveLikedPost(pageSlug, !isLiked);
                } else {
                    // Revert the optimistic update if the API call failed
                    likeBtn.classList.toggle('liked');
                    likeBtn.setAttribute('aria-pressed', isLiked);
                    icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
                    showToast(`Erreur: ${data.message || 'Erreur lors de la mise à jour du like'}`);
                }
            } catch (error) {
                console.error('Error updating like:', error);
                // Revert the optimistic update
                likeBtn.classList.toggle('liked');
                likeBtn.setAttribute('aria-pressed', isLiked);
                icon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
                showToast('Erreur de connexion au serveur');
            }
        }
    });

    // Gestion du tri
    sortButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            sortButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            refreshPosts();
        });
    });

    // Gestion des filtres de ton
    toneButtons.forEach(btn => {
        btn.addEventListener('click', function () {
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

    function refreshPosts() {
        currentPage = 1;
        hasMore = true;
        postsGrid.innerHTML = '';
        loadMorePosts();
    }

    async function loadMorePosts() {
        if (isLoading || !hasMore) return;
        isLoading = true;

        // Afficher le skeleton loader
        const skeleton = createSkeletonLoader();
        postsGrid.appendChild(skeleton);

        try {
            // Construire l'URL avec les paramètres
            const params = new URLSearchParams({
                page: currentPage,
                sort: currentSort,
                per_page: 8
            });
            if (currentTone) {
                params.append('tone', currentTone);
            }

            const response = await fetch(`/api/feed?${params}`);
            const data = await response.json();

            if (data.status === 'success') {
                skeleton.remove();

                if (data.pages.length === 0) {
                    hasMore = false;
                    if (currentPage === 1) {
                        postsGrid.innerHTML = '<div class="no-posts">Aucune page trouvée</div>';
                    }
                    return;
                }

                data.pages.forEach(page => {
                    const postElement = createPostElement(page);
                    postsGrid.appendChild(postElement);
                });

                hasMore = data.has_next;
                currentPage++;
            } else {
                showToast('Erreur lors du chargement des pages');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            showToast('Erreur lors du chargement des pages');
        } finally {
            isLoading = false;
            skeleton.remove();
        }
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

    function createPostElement(page) {
        const article = document.createElement('article');
        article.className = 'post-card';

        // Format the date
        const date = new Date(page.created_at);
        const formattedDate = date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Check if the post is liked
        const isLiked = isPostLiked(page.slug);

        // Create the post card HTML
        article.innerHTML = `
            <div class="post-content">
                <h3 class="post-title">${page.title}</h3>
                <div class="post-meta">Créé le ${formattedDate}</div>
            </div>
            <div class="actions-bar">
                <button class="action-icon like-btn ${isLiked ? 'liked' : ''}" 
                        data-liked="${isLiked}" 
                        data-post-id="${page.id}" 
                        data-page-slug="${page.slug}" 
                        aria-pressed="${isLiked}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span class="like-count">${page.likes || 0}</span>
                    <span class="tooltip">J'aime</span>
                </button>
            </div>
        `;

        // Make the entire card clickable
        article.addEventListener('click', (e) => {
            // Don't navigate if clicking on the like button
            if (!e.target.closest('.like-btn')) {
                window.location.href = `/page/${page.slug}`;
            }
        });

        return article;
    }

    // Initialisation
    refreshPosts();  // This will load trending posts by default
});