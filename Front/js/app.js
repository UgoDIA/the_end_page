document.addEventListener('DOMContentLoaded', function() {
    // Éléments DOM
    const canvas = document.getElementById('canvas');
    const elements = document.querySelectorAll('.element');
    const propertiesPanel = document.getElementById('properties-panel');
    const propertiesContent = document.querySelector('.properties-content');
    const previewBtn = document.getElementById('preview-btn');
    const saveBtn = document.getElementById('save-btn');
    const shareBtn = document.getElementById('share-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resetConfirm = document.getElementById('reset-confirm');
    const resetCancel = document.getElementById('reset-cancel');
    const resetConfirmBtn = document.getElementById('reset-confirm-btn');
    const shareModal = document.getElementById('share-modal');
    const previewModal = document.getElementById('preview-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const previewContainer = document.getElementById('preview-container');
    
    let selectedElement = null;
    let elementCounter = 0;
    
    // Gestionnaire d'événement pour le bouton de réinitialisation
    resetBtn.addEventListener('click', () => {
        resetConfirm.style.display = 'flex';
    });

    // Gestionnaire pour le bouton Annuler
    resetCancel.addEventListener('click', () => {
        resetConfirm.style.display = 'none';
    });

    // Gestionnaire pour le bouton Confirmer
    resetConfirmBtn.addEventListener('click', () => {
        // Effacer le canvas
        canvas.innerHTML = '<div class="placeholder-text">Glissez et déposez des éléments ici pour créer votre page</div>';
        // Réinitialiser le compteur d'éléments
        elementCounter = 0;
        // Réinitialiser l'élément sélectionné
        selectedElement = null;
        // Afficher les propriétés par défaut
        showDefaultProperties();
        // Fermer le popup
        resetConfirm.style.display = 'none';
    });
    
    // Initialisation du glisser-déposer
    elements.forEach(element => {
        element.addEventListener('dragstart', dragStart);
    });
    
    canvas.addEventListener('dragover', dragOver);
    canvas.addEventListener('drop', drop);
    
    // Fonctions de glisser-déposer
    function dragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
    }
    
    function dragOver(e) {
        e.preventDefault();
        canvas.classList.add('drag-over');
    }
    
    function drop(e) {
        e.preventDefault();
        canvas.classList.remove('drag-over');
        
        // Supprimer le texte d'espace réservé si c'est le premier élément
        const placeholder = canvas.querySelector('.placeholder-text');
        if (placeholder) {
            placeholder.remove();
        }
        
        const elementType = e.dataTransfer.getData('text/plain');
        
        // Calculer la position exacte dans le canvas
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;
        
        createCanvasElement(elementType, x, y);
    }
    
    // Création d'un élément sur la toile
    function createCanvasElement(type, x, y) {
        elementCounter++;
        const id = `element-${elementCounter}`;
        
        const element = document.createElement('div');
        element.id = id;
        element.className = 'canvas-element';
        element.dataset.type = type;
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.style.cursor = 'move';
        
        // Ajouter les poignées de redimensionnement
        const resizeHandles = ['nw', 'ne', 'sw', 'se'].map(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.position = pos;
            return handle;
        });
        
        // Contenu par défaut selon le type
        let content = '';
        switch (type) {
            case 'heading':
                content = '<h2>Titre de votre page</h2>';
                break;
            case 'paragraph':
                content = '<p>Votre texte ici. Cliquez pour modifier.</p>';
                break;
            case 'image':
                content = '<img src="https://via.placeholder.com/300x200" alt="Image">';
                break;
            case 'button':
                content = '<button class="btn-primary">Cliquez ici</button>';
                break;
            case 'video':
                content = '<div class="video-placeholder">Vidéo (cliquez pour configurer)</div>';
                break;
            case 'audio':
                content = '<div class="audio-placeholder">Audio (cliquez pour configurer)</div>';
                break;
            case 'gif':
                content = '<div class="gif-placeholder">GIF (cliquez pour configurer)</div>';
                break;
            default:
                content = '<div>Élément</div>';
        }
        
        // Contrôles de l'élément
        const controls = `
            <div class="element-controls">
                <div class="control-btn edit-btn" title="Modifier"><i class="fas fa-edit"></i></div>
                <div class="control-btn delete-btn" title="Supprimer"><i class="fas fa-trash"></i></div>
            </div>
        `;
        
        element.innerHTML = content + controls;
        resizeHandles.forEach(handle => element.appendChild(handle));
        canvas.appendChild(element);
        
        // Ajouter les écouteurs d'événements
        element.addEventListener('click', selectElement);
        element.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showProperties(element);
        });
        element.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            element.remove();
            if (canvas.children.length === 0) {
                canvas.innerHTML = '<div class="placeholder-text">Glissez et déposez des éléments ici pour créer votre page</div>';
            }
            if (selectedElement === element) {
                selectedElement = null;
                showDefaultProperties();
            }
        });
        
        // Rendre l'élément déplaçable
        makeElementDraggable(element);
        
        // Ajouter la fonctionnalité de redimensionnement
        makeElementResizable(element);
        
        // Sélectionner automatiquement le nouvel élément
        selectElement.call(element);
    }
    
    // Rendre un élément déplaçable
    function makeElementDraggable(element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        element.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // Ne pas démarrer le glissement si on clique sur un contrôle
            if (e.target.closest('.element-controls')) return;
            
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === element || element.contains(e.target)) {
                isDragging = true;
                element.style.cursor = 'grabbing';
                element.style.zIndex = '1000'; // Mettre l'élément au premier plan
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                // Calculer les nouvelles positions
                const newLeft = parseInt(element.style.left || 0) + currentX;
                const newTop = parseInt(element.style.top || 0) + currentY;

                // Appliquer les nouvelles positions
                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;

                // Réinitialiser les offsets pour le prochain mouvement
                initialX = e.clientX;
                initialY = e.clientY;
            }
        }

        function dragEnd(e) {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                element.style.zIndex = '1'; // Remettre l'élément à son niveau normal
            }
        }
    }
    
    // Fonction pour rendre un élément redimensionnable
    function makeElementResizable(element) {
        const handles = element.querySelectorAll('.resize-handle');
        const type = element.dataset.type;
        
        // Définir les limites de taille selon le type d'élément
        const sizeLimits = {
            heading: { minWidth: 100, minHeight: 40, maxWidth: 800, maxHeight: 200 },
            paragraph: { minWidth: 150, minHeight: 60, maxWidth: 600, maxHeight: 400 },
            image: { minWidth: 100, minHeight: 100, maxWidth: 800, maxHeight: 600 },
            video: { minWidth: 200, minHeight: 150, maxWidth: 800, maxHeight: 450 },
            button: { minWidth: 120, minHeight: 40, maxWidth: 300, maxHeight: 100 },
            audio: { minWidth: 200, minHeight: 50, maxWidth: 400, maxHeight: 100 },
            gif: { minWidth: 100, minHeight: 100, maxWidth: 500, maxHeight: 500 }
        };
        
        const limits = sizeLimits[type] || { minWidth: 50, minHeight: 50, maxWidth: 800, maxHeight: 600 };
        
        handles.forEach(handle => {
            handle.addEventListener('mousedown', initResize);
        });
        
        function initResize(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const handle = e.target;
            const position = handle.dataset.position;
            const elementRect = element.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            
            let startX = e.clientX;
            let startY = e.clientY;
            let startWidth = elementRect.width;
            let startHeight = elementRect.height;
            let startLeft = elementRect.left - canvasRect.left;
            let startTop = elementRect.top - canvasRect.top;
            
            function resize(e) {
                e.preventDefault();
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                // Calculer les nouvelles dimensions selon la poignée utilisée
                switch(position) {
                    case 'se':
                        newWidth = startWidth + deltaX;
                        newHeight = startHeight + deltaY;
                        break;
                    case 'sw':
                        newWidth = startWidth - deltaX;
                        newHeight = startHeight + deltaY;
                        newLeft = startLeft + deltaX;
                        break;
                    case 'ne':
                        newWidth = startWidth + deltaX;
                        newHeight = startHeight - deltaY;
                        newTop = startTop + deltaY;
                        break;
                    case 'nw':
                        newWidth = startWidth - deltaX;
                        newHeight = startHeight - deltaY;
                        newLeft = startLeft + deltaX;
                        newTop = startTop + deltaY;
                        break;
                }
                
                // Appliquer les limites de taille
                newWidth = Math.max(limits.minWidth, Math.min(newWidth, limits.maxWidth));
                newHeight = Math.max(limits.minHeight, Math.min(newHeight, limits.maxHeight));
                
                // Appliquer les limites de position
                newLeft = Math.max(0, Math.min(newLeft, canvasRect.width - newWidth));
                newTop = Math.max(0, Math.min(newTop, canvasRect.height - newHeight));
                
                // Appliquer les nouvelles dimensions
                element.style.width = `${newWidth}px`;
                element.style.height = `${newHeight}px`;
                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;
                
                // Ajuster le contenu
                adjustContent(element, newWidth, newHeight);
            }
            
            function stopResize() {
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
            }
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        }
    }
    
    // Fonction pour ajuster le contenu lors du redimensionnement
    function adjustContent(element, width, height) {
        const type = element.dataset.type;
        const content = element.querySelector('img, video, iframe, p, h1, h2, h3, h4, button');
        
        if (!content) return;
        
        switch(type) {
            case 'image':
                if (content.tagName === 'IMG') {
                    content.style.maxWidth = '100%';
                    content.style.maxHeight = '100%';
                    content.style.objectFit = 'contain';
                }
                break;
            case 'video':
            case 'audio':
                if (content.tagName === 'VIDEO' || content.tagName === 'AUDIO' || content.tagName === 'IFRAME') {
                    content.style.width = '100%';
                    content.style.height = '100%';
                    content.style.objectFit = 'contain';
                }
                break;
            case 'paragraph':
            case 'heading':
                if (content.tagName === 'P' || content.tagName.startsWith('H')) {
                    content.style.width = '100%';
                    content.style.height = '100%';
                    content.style.wordWrap = 'break-word';
                    content.style.overflow = 'auto';
                    
                    // Ajuster la taille de la police en fonction de la largeur
                    const fontSize = Math.max(12, Math.min(24, width / 20));
                    content.style.fontSize = `${fontSize}px`;
                }
                break;
            case 'button':
                if (content.tagName === 'BUTTON') {
                    content.style.width = '100%';
                    content.style.height = '100%';
                    content.style.whiteSpace = 'normal';
                    content.style.wordWrap = 'break-word';
                    
                    // Ajuster la taille de la police en fonction de la largeur
                    const fontSize = Math.max(12, Math.min(18, width / 15));
                    content.style.fontSize = `${fontSize}px`;
                }
                break;
        }
    }
    
    // Sélectionner un élément
    function selectElement() {
        // Désélectionner l'élément précédent
        if (selectedElement) {
            selectedElement.classList.remove('selected');
        }
        
        // Sélectionner le nouvel élément
        this.classList.add('selected');
        selectedElement = this;
        
        // Afficher les propriétés
        showProperties(this);
    }
    
    // Afficher les propriétés d'un élément
    function showProperties(element) {
        const type = element.dataset.type;
        let propertiesHTML = `<h4>Propriétés de ${getTypeName(type)}</h4>`;
        
        // Propriétés communes
        propertiesHTML += `
            <div class="property-group">
                <label for="element-width">Largeur</label>
                <input type="text" id="element-width" value="${element.style.width || 'auto'}">
            </div>
            <div class="property-group">
                <label for="element-height">Hauteur</label>
                <input type="text" id="element-height" value="${element.style.height || 'auto'}">
            </div>
        `;
        
        // Propriétés spécifiques au type
        switch (type) {
            case 'heading':
                const headingText = element.querySelector('h2').innerText;
                propertiesHTML += `
                    <div class="property-group">
                        <label for="heading-text">Texte</label>
                        <input type="text" id="heading-text" value="${headingText}">
                    </div>
                    <div class="property-group">
                        <label for="heading-size">Taille</label>
                        <select id="heading-size">
                            <option value="h1">Très grand (H1)</option>
                            <option value="h2" selected>Grand (H2)</option>
                            <option value="h3">Moyen (H3)</option>
                            <option value="h4">Petit (H4)</option>
                        </select>
                    </div>
                `;
                break;
            case 'paragraph':
                const paragraphText = element.querySelector('p').innerText;
                propertiesHTML += `
                    <div class="property-group">
                        <label for="paragraph-text">Texte</label>
                        <textarea id="paragraph-text" rows="4">${paragraphText}</textarea>
                    </div>
                `;
                break;
            case 'image':
                propertiesHTML += `
                    <div class="property-group">
                        <label for="image-url">URL de l'image</label>
                        <input type="text" id="image-url" value="${element.querySelector('img').src}">
                    </div>
                    <div class="property-group">
                        <label for="image-alt">Texte alternatif</label>
                        <input type="text" id="image-alt" value="${element.querySelector('img').alt}">
                    </div>
                `;
                break;
            case 'button':
                const buttonText = element.querySelector('button').innerText;
                propertiesHTML += `
                    <div class="property-group">
                        <label for="button-text">Texte</label>
                        <input type="text" id="button-text" value="${buttonText}">
                    </div>
                    <div class="property-group">
                        <label for="button-url">URL (lien)</label>
                        <input type="text" id="button-url" value="#">
                    </div>
                `;
                break;
            case 'video':
                propertiesHTML += `
                    <div class="property-group">
                        <label for="video-url">URL de la vidéo</label>
                        <input type="text" id="video-url" placeholder="URL YouTube, Vimeo, etc.">
                    </div>
                    <div class="property-group">
                        <label for="video-autoplay">Lecture automatique</label>
                        <input type="checkbox" id="video-autoplay">
                    </div>
                `;
                break;
            case 'audio':
                propertiesHTML += `
                    <div class="property-group">
                        <label for="audio-url">URL du fichier audio</label>
                        <input type="text" id="audio-url" placeholder="URL du fichier MP3, WAV, etc.">
                    </div>
                    <div class="property-group">
                        <label for="audio-autoplay">Lecture automatique</label>
                        <input type="checkbox" id="audio-autoplay">
                    </div>
                `;
                break;
            case 'gif':
                propertiesHTML += `
                    <div class="property-group">
                        <label for="gif-url">URL du GIF</label>
                        <input type="text" id="gif-url" placeholder="URL du fichier GIF">
                    </div>
                `;
                break;
        }
        
        // Propriétés de style communes
        propertiesHTML += `
            <h4>Style</h4>
            <div class="property-group">
                <label for="element-bg-color">Couleur de fond</label>
                <input type="color" id="element-bg-color" value="#ffffff">
            </div>
            <div class="property-group">
                <label for="element-text-color">Couleur du texte</label>
                <input type="color" id="element-text-color" value="#333333">
            </div>
            <div class="property-group">
                <label for="element-padding">Espacement interne</label>
                <input type="text" id="element-padding" value="${element.style.padding || '1rem'}">
            </div>
            <button id="apply-properties" class="btn-primary">Appliquer</button>
        `;
        
        propertiesContent.innerHTML = propertiesHTML;
        
        // Ajouter l'écouteur d'événement pour le bouton Appliquer
        document.getElementById('apply-properties').addEventListener('click', () => {
            applyProperties(element);
        });
    }
    
    // Appliquer les propriétés à un élément
    function applyProperties(element) {
        const type = element.dataset.type;
        
        // Propriétés communes
        element.style.width = document.getElementById('element-width').value;
        element.style.height = document.getElementById('element-height').value;
        element.style.backgroundColor = document.getElementById('element-bg-color').value;
        element.style.color = document.getElementById('element-text-color').value;
        element.style.padding = document.getElementById('element-padding').value;
        
        // Propriétés spécifiques au type
        switch (type) {
            case 'heading':
                const headingText = document.getElementById('heading-text').value;
                const headingSize = document.getElementById('heading-size').value;
                const headingElement = document.createElement(headingSize);
                headingElement.innerText = headingText;
                element.querySelector('h1, h2, h3, h4').replaceWith(headingElement);
                break;
            case 'paragraph':
                const paragraphText = document.getElementById('paragraph-text').value;
                element.querySelector('p').innerText = paragraphText;
                break;
            case 'image':
                const imageUrl = document.getElementById('image-url').value;
                const imageAlt = document.getElementById('image-alt').value;
                element.querySelector('img').src = imageUrl;
                element.querySelector('img').alt = imageAlt;
                break;
            case 'button':
                const buttonText = document.getElementById('button-text').value;
                const buttonUrl = document.getElementById('button-url').value;
                element.querySelector('button').innerText = buttonText;
                // Ajouter un lien si nécessaire
                if (buttonUrl && buttonUrl !== '#') {
                    element.querySelector('button').onclick = function() {
                        window.open(buttonUrl, '_blank');
                    };
                }
                break;
            case 'video':
                const videoUrl = document.getElementById('video-url').value;
                const videoAutoplay = document.getElementById('video-autoplay').checked;
                if (videoUrl) {
                    // Détecter le type de vidéo (YouTube, Vimeo, etc.)
                    let videoEmbed = '';
                    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                        // Extraire l'ID YouTube
                        let youtubeId = '';
                        if (videoUrl.includes('youtube.com/watch?v=')) {
                            youtubeId = videoUrl.split('v=')[1].split('&')[0];
                        } else if (videoUrl.includes('youtu.be/')) {
                            youtubeId = videoUrl.split('youtu.be/')[1];
                        }
                        videoEmbed = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeId}${videoAutoplay ? '?autoplay=1' : ''}" frameborder="0" allowfullscreen></iframe>`;
                    } else if (videoUrl.includes('vimeo.com')) {
                        // Extraire l'ID Vimeo
                        const vimeoId = videoUrl.split('vimeo.com/')[1];
                        videoEmbed = `<iframe width="100%" height="100%" src="https://player.vimeo.com/video/${vimeoId}${videoAutoplay ? '?autoplay=1' : ''}" frameborder="0" allowfullscreen></iframe>`;
                    } else {
                        // Vidéo HTML5 standard
                        videoEmbed = `<video width="100%" height="100%" controls ${videoAutoplay ? 'autoplay' : ''}><source src="${videoUrl}" type="video/mp4">Votre navigateur ne prend pas en charge la vidéo HTML5.</video>`;
                    }
                    element.innerHTML = videoEmbed + element.querySelector('.element-controls').outerHTML;
                }
                break;
            case 'audio':
                const audioUrl = document.getElementById('audio-url').value;
                const audioAutoplay = document.getElementById('audio-autoplay').checked;
                if (audioUrl) {
                    const audioEmbed = `<audio controls ${audioAutoplay ? 'autoplay' : ''}><source src="${audioUrl}" type="audio/mpeg">Votre navigateur ne prend pas en charge l'audio HTML5.</audio>`;
                    element.innerHTML = audioEmbed + element.querySelector('.element-controls').outerHTML;
                }
                break;
            case 'gif':
                const gifUrl = document.getElementById('gif-url').value;
                if (gifUrl) {
                    const gifEmbed = `<img src="${gifUrl}" alt="GIF animé" style="width: 100%; height: auto;">`;
                    element.innerHTML = gifEmbed + element.querySelector('.element-controls').outerHTML;
                }
                break;
        }
        
        // Réattacher les écouteurs d'événements
        element.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            showProperties(element);
        });
        element.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            element.remove();
            if (canvas.children.length === 0) {
                canvas.innerHTML = '<div class="placeholder-text">Glissez et déposez des éléments ici pour créer votre page</div>';
            }
            if (selectedElement === element) {
                selectedElement = null;
                showDefaultProperties();
            }
        });
    }
    
    // Afficher les propriétés par défaut
    function showDefaultProperties() {
        propertiesContent.innerHTML = '<p class="no-selection">Sélectionnez un élément pour modifier ses propriétés</p>';
    }
    
    // Obtenir le nom du type d'élément
    function getTypeName(type) {
        const typeNames = {
            'heading': 'Titre',
            'paragraph': 'Paragraphe',
            'image': 'Image',
            'button': 'Bouton',
            'video': 'Vidéo',
            'audio': 'Audio',
            'gif': 'GIF'
        };
        return typeNames[type] || 'Élément';
    }
    
    // Gestion des modales
    previewBtn.addEventListener('click', () => {
        // Générer l'aperçu
        const previewHTML = generatePreview();
        previewContainer.innerHTML = previewHTML;
        previewModal.style.display = 'flex';
    });
    
    shareBtn.addEventListener('click', () => {
        // Générer un lien de partage
        const pageData = savePageData();
        const shareId = generateShareId();
        // Simuler le stockage (dans une application réelle, cela serait stocké dans une base de données)
        localStorage.setItem(`page_${shareId}`, JSON.stringify(pageData));
        
        // Afficher le lien
        const shareUrl = `${window.location.origin}/view.html?id=${shareId}`;
        shareLink.value = shareUrl;
        shareModal.style.display = 'flex';
    });
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shareModal.style.display = 'none';
            previewModal.style.display = 'none';
        });
    });
    
    copyLinkBtn.addEventListener('click', () => {
        shareLink.select();
        document.execCommand('copy');
        alert('Lien copié dans le presse-papiers !');
    });
    
    // Sauvegarder les données de la page
    function savePageData() {
        const elements = [];
        canvas.querySelectorAll('.canvas-element').forEach(element => {
            elements.push({
                type: element.dataset.type,
                content: element.innerHTML,
                style: {
                    top: element.style.top,
                    left: element.style.left,
                    width: element.style.width,
                    height: element.style.height,
                    backgroundColor: element.style.backgroundColor,
                    color: element.style.color,
                    padding: element.style.padding
                }
            });
        });
        
        return {
            title: 'Ma page de départ',
            theme: document.getElementById('theme-select').value,
            tone: document.getElementById('tone-select').value,
            elements: elements
        };
    }
    
    // Générer un aperçu
    function generatePreview() {
        const theme = document.getElementById('theme-select').value;
        const tone = document.getElementById('tone-select').value;
        
        let previewHTML = `
            <div class="preview-page ${theme}-theme ${tone}-tone">
        `;
        
        // Ajouter les éléments
        canvas.querySelectorAll('.canvas-element').forEach(element => {
            // Cloner l'élément sans les contrôles
            const clone = element.cloneNode(true);
            const controls = clone.querySelector('.element-controls');
            if (controls) controls.remove();
            
            previewHTML += `
                <div class="preview-element" style="
                    position: absolute;
                    top: ${element.style.top};
                    left: ${element.style.left};
                    width: ${element.style.width || 'auto'};
                    height: ${element.style.height || 'auto'};
                    background-color: ${element.style.backgroundColor || 'transparent'};
                    color: ${element.style.color || 'inherit'};
                    padding: ${element.style.padding || '1rem'};
                ">
                    ${clone.innerHTML}
                </div>
            `;
        });
        
        previewHTML += `</div>`;
        return previewHTML;
    }
    
    // Générer un ID de partage
    function generateShareId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    // Appliquer le thème sélectionné
    document.getElementById('theme-select').addEventListener('change', function() {
        const theme = this.value;
        document.body.className = ''; // Réinitialiser les classes
        document.body.classList.add(`${theme}-theme`);
    });
    
    // Sauvegarder la page
    saveBtn.addEventListener('click', () => {
        const pageData = savePageData();
        localStorage.setItem('saved_page', JSON.stringify(pageData));
        alert('Page sauvegardée avec succès !');
    });
    
    // Charger une page sauvegardée (si disponible)
    const savedPage = localStorage.getItem('saved_page');
    if (savedPage) {
        try {
            const pageData = JSON.parse(savedPage);
            loadPageData(pageData);
        } catch (e) {
            console.error('Erreur lors du chargement de la page sauvegardée:', e);
        }
    }
    
    // Charger les données de la page
    function loadPageData(pageData) {
        // Appliquer le thème et le ton
        document.getElementById('theme-select').value = pageData.theme;
        document.getElementById('tone-select').value = pageData.tone;
        
        // Effacer le canvas
        canvas.innerHTML = '';
        
        // Ajouter les éléments
        pageData.elements.forEach(elementData => {
            const element = document.createElement('div');
            element.className = 'canvas-element';
            element.dataset.type = elementData.type;
            element.style.position = 'absolute';
            element.style.top = elementData.style.top;
            element.style.left = elementData.style.left;
            element.style.width = elementData.style.width;
            element.style.height = elementData.style.height;
            element.style.backgroundColor = elementData.style.backgroundColor;
            element.style.color = elementData.style.color;
            element.style.padding = elementData.style.padding;
            
            // Ajouter le contenu sans les contrôles
            element.innerHTML = elementData.content;
            
            // Ajouter les contrôles
            const controls = document.createElement('div');
            controls.className = 'element-controls';
            controls.innerHTML = `
                <div class="control-btn edit-btn" title="Modifier"><i class="fas fa-edit"></i></div>
                <div class="control-btn delete-btn" title="Supprimer"><i class="fas fa-trash"></i></div>
            `;
            element.appendChild(controls);
            
            canvas.appendChild(element);
            
            // Ajouter les écouteurs d'événements
            element.addEventListener('click', selectElement);
            element.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showProperties(element);
            });
            element.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                element.remove();
                if (canvas.children.length === 0) {
                    canvas.innerHTML = '<div class="placeholder-text">Glissez et déposez des éléments ici pour créer votre page</div>';
                }
                if (selectedElement === element) {
                    selectedElement = null;
                    showDefaultProperties();
                }
            });
            
            // Rendre l'élément déplaçable
            makeElementDraggable(element);
        });
    }
});