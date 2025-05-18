let isInitialized = false;

document.addEventListener('DOMContentLoaded', function () {
    // Prevent multiple initializations
    if (isInitialized) return;
    isInitialized = true;

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

    // Sons pour le feedback
    const sounds = {
        add: new Audio('sounds/add.mp3'),
        edit: new Audio('sounds/edit.mp3'),
        save: new Audio('sounds/save.mp3')
    };

    // Fonction pour jouer un son
    function playSound(soundName) {
        if (sounds[soundName]) {
            sounds[soundName].currentTime = 0;
            sounds[soundName].play().catch(() => { });
        }
    }

    // Initialisation du glisser-déposer
    let isDraggingFromShelf = false;
    let dragInProgress = false;
    let lastDropTime = 0;

    // Remove all existing drag and drop event listeners
    const removeDragDropListeners = (element) => {
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        return newElement;
    };

    // Reattach drag and drop event listeners
    const attachDragDropListeners = (element) => {
        element.addEventListener('dragstart', (e) => {
            if (dragInProgress) return;
            dragInProgress = true;
            isDraggingFromShelf = true;
            e.stopPropagation();
            console.log('Drag Start:', {
                element: e.target,
                type: e.target.dataset.type,
                isDraggingFromShelf,
                dragInProgress
            });
            dragStart(e);
        });

        element.addEventListener('dragend', (e) => {
            e.stopPropagation();
            console.log('Drag End:', {
                element: e.target,
                type: e.target.dataset.type,
                isDraggingFromShelf,
                dragInProgress
            });
            dragInProgress = false;
            isDraggingFromShelf = false;
        });
    };

    // Clean up and reattach listeners for all elements
    elements.forEach(element => {
        const newElement = removeDragDropListeners(element);
        attachDragDropListeners(newElement);
    });

    // Set up canvas drop handling
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.add('drag-over');
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        canvas.classList.remove('drag-over');

        console.log('Drop Event:', {
            isDraggingFromShelf,
            dragInProgress,
            timeSinceLastDrop: Date.now() - lastDropTime,
            elementType: e.dataTransfer.getData('text/plain')
        });

        // Prevent multiple drops within 500ms
        const now = Date.now();
        if (now - lastDropTime < 500) {
            console.log('Drop prevented: Too soon after last drop');
            return;
        }
        lastDropTime = now;

        // Prevent multiple drops
        if (!isDraggingFromShelf || !dragInProgress) {
            console.log('Drop prevented: Invalid drag state', {
                isDraggingFromShelf,
                dragInProgress
            });
            return;
        }

        // Reset drag state
        dragInProgress = false;
        isDraggingFromShelf = false;

        // Supprimer le texte d'espace réservé si c'est le premier élément
        const placeholder = canvas.querySelector('.placeholder-text');
        if (placeholder) {
            placeholder.remove();
        }

        const elementType = e.dataTransfer.getData('text/plain');
        if (!elementType) {
            console.log('Drop prevented: No element type');
            return;
        }

        // Calculer la position exacte dans le canvas
        const canvasRect = canvas.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        console.log('Creating element:', {
            type: elementType,
            position: { x, y }
        });

        // Create element with a small delay to prevent double creation
        setTimeout(() => {
            if (elementType.startsWith('hero-') || elementType === 'testimonial' ||
                elementType === 'quote' || elementType === 'footer') {
                createPredefinedBlock(elementType, x, y);
            } else {
                createCanvasElement(elementType, x, y);
            }
        }, 50);
    });

    // Fonctions de glisser-déposer
    function dragStart(e) {
        // Ne pas démarrer le glissement si on clique sur un contrôle ou sur une image déjà existante
        if (e.target.closest('.element-controls')) return;
        // Correction : empêcher le dragstart natif sur les images dans le canvas
        if (e.target.tagName === 'IMG' && e.target.closest('.canvas-element')) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', e.target.dataset.type);
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
                content = '<button class="btn-primary" onclick="window.open(\'#\', \'_blank\')">Cliquez ici</button>';
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
      
        playSound('add');
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
            if (e.target.closest('.element-controls')) return;
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
            if (e.target === element || element.contains(e.target)) {
                isDragging = true;
                element.style.cursor = 'grabbing';
                element.style.zIndex = '1000';
                element.classList.add('dragging');
            }
        }
        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                xOffset = currentX;
                yOffset = currentY;
                const newLeft = parseInt(element.style.left || 0) + currentX;
                const newTop = parseInt(element.style.top || 0) + currentY;
                element.style.left = `${newLeft}px`;
                element.style.top = `${newTop}px`;
                initialX = e.clientX;
                initialY = e.clientY;
            }
        }
        function dragEnd(e) {
            if (isDragging) {
                isDragging = false;
                element.style.cursor = 'move';
                element.style.zIndex = '1';
                element.classList.remove('dragging');
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
                switch (position) {
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

        switch (type) {
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
        // Suppression des champs de largeur et hauteur
        // propertiesHTML += `
        //     <div class="property-group">
        //         <label for="element-width">Largeur</label>
        //         <input type="text" id="element-width" value="${element.style.width || 'auto'}">
        //     </div>
        //     <div class="property-group">
        //         <label for="element-height">Hauteur</label>
        //         <input type="text" id="element-height" value="${element.style.height || 'auto'}">
        //     </div>
        // `;

        // Propriétés spécifiques au type
        switch (type) {
            case 'heading': {
                const heading = element.querySelector('h1, h2, h3, h4');
                const headingText = heading ? heading.innerText : '';
                const fontSize = heading ? (heading.style.fontSize ? parseInt(heading.style.fontSize) : 32) : 32;
                const fontFamily = heading ? (heading.style.fontFamily || 'Arial') : 'Arial';
                const fontWeight = heading ? (heading.style.fontWeight || 'normal') : 'normal';
                const fontStyle = heading ? (heading.style.fontStyle || 'normal') : 'normal';
                const textDecoration = heading ? (heading.style.textDecoration || 'none') : 'none';
                propertiesHTML += `
                    <div class="property-group">
                        <label for="heading-text">Texte</label>
                        <input type="text" id="heading-text" value="${headingText}">
                    </div>
                    <div class="property-group">
                        <label for="heading-font-size">Taille (px)</label>
                        <input type="number" id="heading-font-size" min="10" max="120" value="${fontSize}">
                    </div>
                    <div class="property-group">
                        <label for="heading-font-family">Police</label>
                        <select id="heading-font-family">
                            <option value="Arial" ${fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option value="Times New Roman" ${fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Helvetica" ${fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                            <option value="Georgia" ${fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            <option value="Courier New" ${fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Style</label>
                        <div style="display:flex;gap:8px;">
                            <button type="button" id="heading-bold" class="style-btn${fontWeight === 'bold' ? ' active' : ''}"><b>B</b></button>
                            <button type="button" id="heading-italic" class="style-btn${fontStyle === 'italic' ? ' active' : ''}"><i>I</i></button>
                            <button type="button" id="heading-underline" class="style-btn${textDecoration.includes('underline') ? ' active' : ''}"><u>U</u></button>
                            <button type="button" id="heading-strike" class="style-btn${textDecoration.includes('line-through') ? ' active' : ''}"><s>S</s></button>
                        </div>
                    </div>
                `;
                break;
            }
            case 'paragraph': {
                const p = element.querySelector('p');
                const paragraphText = p ? p.innerText : '';
                const fontSize = p ? (p.style.fontSize ? parseInt(p.style.fontSize) : 18) : 18;
                const fontFamily = p ? (p.style.fontFamily || 'Arial') : 'Arial';
                const fontWeight = p ? (p.style.fontWeight || 'normal') : 'normal';
                const fontStyle = p ? (p.style.fontStyle || 'normal') : 'normal';
                const textDecoration = p ? (p.style.textDecoration || 'none') : 'none';
                propertiesHTML += `
                    <div class="property-group">
                        <label for="paragraph-text">Texte</label>
                        <textarea id="paragraph-text" rows="4">${paragraphText}</textarea>
                    </div>
                    <div class="property-group">
                        <label for="paragraph-font-size">Taille (px)</label>
                        <input type="number" id="paragraph-font-size" min="10" max="60" value="${fontSize}">
                    </div>
                    <div class="property-group">
                        <label for="paragraph-font-family">Police</label>
                        <select id="paragraph-font-family">
                            <option value="Arial" ${fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                            <option value="Times New Roman" ${fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                            <option value="Helvetica" ${fontFamily === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
                            <option value="Georgia" ${fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            <option value="Courier New" ${fontFamily === 'Courier New' ? 'selected' : ''}>Courier New</option>
                        </select>
                    </div>
                    <div class="property-group">
                        <label>Style</label>
                        <div style="display:flex;gap:8px;">
                            <button type="button" id="paragraph-bold" class="style-btn${fontWeight === 'bold' ? ' active' : ''}"><b>B</b></button>
                            <button type="button" id="paragraph-italic" class="style-btn${fontStyle === 'italic' ? ' active' : ''}"><i>I</i></button>
                            <button type="button" id="paragraph-underline" class="style-btn${textDecoration.includes('underline') ? ' active' : ''}"><u>U</u></button>
                            <button type="button" id="paragraph-strike" class="style-btn${textDecoration.includes('line-through') ? ' active' : ''}"><s>S</s></button>
                        </div>
                    </div>
                `;
                break;
            }
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
                        <input type="text" id="button-url" value="">
                    </div>
                    <div class="property-group">
                        <label for="button-hover-color">Couleur au survol</label>
                        <input type="color" id="button-hover-color" value="#3498db">
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
                <input type="color" id="element-bg-color" value="${element.style.backgroundColor || '#ffffff'}">
            </div>
            <div class="property-group">
                <label for="element-text-color">Couleur du texte</label>
                <input type="color" id="element-text-color" value="${element.style.color || '#333333'}">
            </div>
            <button id="apply-properties" class="btn-primary">Appliquer</button>
        `;

        propertiesContent.innerHTML = propertiesHTML;

        // Ajouter l'écouteur d'événement pour le bouton Appliquer
        document.getElementById('apply-properties').addEventListener('click', () => {
            applyProperties(element);
        });

        // Ajout : mise à jour en temps réel des couleurs depuis le panneau de propriétés
        bindLiveStyleProperties(element);
    }

    // Appliquer les propriétés à un élément
    function applyProperties(element) {
        const type = element.dataset.type;
        // Propriétés communes
        // Correction : ne pas accéder à padding si le champ n'existe plus
        const paddingInput = document.getElementById('element-padding');
        if (paddingInput) {
            element.style.padding = paddingInput.value;
        }
        // Correction : couleur du texte appliquée sur le bon élément
        const textColor = document.getElementById('element-text-color').value;
        // Propriétés spécifiques au type
        switch (type) {
            case 'heading': {
                const headingText = document.getElementById('heading-text').value;
                const headingFontSize = document.getElementById('heading-font-size').value;
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) {
                    heading.innerText = headingText;
                    heading.style.fontSize = headingFontSize + 'px';
                    heading.style.color = textColor;
                }
                break;
            }
            case 'paragraph': {
                const paragraphText = document.getElementById('paragraph-text').value;
                const paragraphFontSize = document.getElementById('paragraph-font-size').value;
                const p = element.querySelector('p');
                if (p) {
                    p.innerText = paragraphText;
                    p.style.fontSize = paragraphFontSize + 'px';
                    p.style.color = textColor;
                }
                break;
            }
            case 'image': {
                const imageUrl = document.getElementById('image-url').value;
                const imageAlt = document.getElementById('image-alt').value;
                const img = element.querySelector('img');
                if (img) {
                    img.src = imageUrl;
                    img.alt = imageAlt;
                }
                break;
            }
            case 'button': {
                const buttonText = document.getElementById('button-text').value;
                const buttonUrl = document.getElementById('button-url').value;
                const buttonHoverColor = document.getElementById('button-hover-color').value;
                const btn = element.querySelector('button');
                if (btn) {
                    btn.innerText = buttonText;
                    if (buttonUrl && buttonUrl !== '#') {
                        let url = buttonUrl;
                        if (!/^https?:\/\//i.test(url)) {
                            url = 'https://' + url;
                        }
                        btn.onclick = function (e) {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open(url, '_blank');
                        };
                    } else {
                        btn.onclick = null;
                    }
                    // Appliquer la couleur au survol
                    btn.style.transition = 'background-color 0.3s, color 0.3s';
                    btn.onmouseover = function () {
                        this.style.backgroundColor = buttonHoverColor;
                    };
                    btn.onmouseout = function () {
                        this.style.backgroundColor = '';
                    };
                }
                break;
            }
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
        // Vider le panneau de propriétés après application
        showDefaultProperties();
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
    shareBtn.addEventListener('click', async () => {
        try {
            // Save the page first
            const pageData = savePageData();
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pageData)
            });

            const result = await response.json();
            if (result.status === 'success') {
                // Generate share URL using the page slug
                const shareUrl = `${window.location.origin}/page/${result.page.slug}`;
                shareLink.value = shareUrl;
                shareModal.style.display = 'flex';
            } else {
                console.log('Erreur lors de la sauvegarde de la page');
            }
        } catch (error) {
            console.error('Error saving page:', error);

        }
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            shareModal.style.display = 'none';
        });
    });

    copyLinkBtn.addEventListener('click', () => {
        shareLink.select();
        document.execCommand('copy');

    });

    // Sauvegarder les données de la page
    function savePageData() {
        const elements = [];
        canvas.querySelectorAll('.canvas-element').forEach((element, index) => {
            elements.push({
                type: element.dataset.type,
                content: {
                    html: element.innerHTML,
                    style: {
                        top: element.style.top,
                        left: element.style.left,
                        width: element.style.width,
                        height: element.style.height,
                        backgroundColor: element.style.backgroundColor,
                        color: element.style.color,
                        padding: element.style.padding
                    }
                },
                position: index + 1
            });
        });

        return {
            title: document.querySelector('.page-title')?.textContent || 'Sans titre',
            slug: generateSlug(),
            theme: document.body.dataset.theme || 'light',
            tone: document.body.dataset.tone || 'honest',
            content: {
                elements: elements
            }
        };
    }

    // Generate a URL-friendly slug
    function generateSlug() {
        const timestamp = new Date().getTime();
        const random = Math.random().toString(36).substring(2, 8);
        return `page-${timestamp}-${random}`;
    }

    // Add save button event listener
    saveBtn.addEventListener('click', async () => {
        try {
            const pageData = savePageData();
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pageData)
            });

            const result = await response.json();
            if (result.status === 'success') {
                showToast('Page sauvegardée avec succès !');
                playSound('save');
            } else {
                showToast('Erreur lors de la sauvegarde de la page');
            }
        } catch (error) {
            console.error('Error saving page:', error);
            showToast('Erreur lors de la sauvegarde de la page');
        }
    });

    // Check if we're on a shared page
    document.addEventListener('DOMContentLoaded', function () {
        const path = window.location.pathname;
        const match = path.match(/\/page\/([^\/]+)/);

        if (match) {
            const slug = match[1];
            loadPage(slug);
        }
    });

    // Appliquer le thème sélectionné
    document.getElementById('theme-select').addEventListener('change', function () {
        const theme = this.value;
        document.body.className = ''; // Réinitialiser les classes
        document.body.classList.add(`${theme}-theme`);
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
            element.innerHTML = elementData.content.html;

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

    // Fonction pour ajouter le mini-toolbar à un élément
    function addMiniToolbar(element) {
        const toolbar = document.createElement('div');
        toolbar.className = 'mini-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-dropdown">
                <button class="toolbar-btn" title="Police">
                    <i class="fas fa-font"></i>
                </button>
                <div class="toolbar-dropdown-content">
                    <select class="font-select">
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Helvetica">Helvetica</option>
                    </select>
                </div>
            </div>
            <div class="toolbar-dropdown">
                <button class="toolbar-btn" title="Taille">
                    <i class="fas fa-text-height"></i>
                </button>
                <div class="toolbar-dropdown-content">
                    <input type="range" min="12" max="72" value="16" class="size-slider">
                </div>
            </div>
            <button class="toolbar-btn" title="Gras">
                <i class="fas fa-bold"></i>
            </button>
            <button class="toolbar-btn" title="Italique">
                <i class="fas fa-italic"></i>
            </button>
            <div class="toolbar-dropdown">
                <button class="toolbar-btn" title="Couleur">
                    <i class="fas fa-palette"></i>
                </button>
                <div class="toolbar-dropdown-content">
                    <input type="color" class="color-picker">
                </div>
            </div>
            <button class="toolbar-btn" title="Alignement gauche">
                <i class="fas fa-align-left"></i>
            </button>
            <button class="toolbar-btn" title="Alignement centre">
                <i class="fas fa-align-center"></i>
            </button>
            <button class="toolbar-btn" title="Alignement droite">
                <i class="fas fa-align-right"></i>
            </button>
        `;
        element.appendChild(toolbar);

        // Ajouter les écouteurs d'événements pour le toolbar
        const buttons = toolbar.querySelectorAll('.toolbar-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.title.toLowerCase();
                applyToolbarAction(element, action);
                playSound('edit');
            });
        });

        // Gérer les changements de police
        const fontSelect = toolbar.querySelector('.font-select');
        if (fontSelect) {
            fontSelect.addEventListener('change', (e) => {
                element.style.fontFamily = e.target.value;
                playSound('edit');
            });
        }

        // Gérer les changements de taille
        const sizeSlider = toolbar.querySelector('.size-slider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                element.style.fontSize = `${e.target.value}px`;
                playSound('edit');
            });
        }

        // Gérer les changements de couleur
        const colorPicker = toolbar.querySelector('.color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('input', (e) => {
                element.style.color = e.target.value;
                playSound('edit');
            });
        }
    }

    // Fonction pour appliquer une action du toolbar
    function applyToolbarAction(element, action) {
        const content = element.querySelector('p, h1, h2, h3, h4');
        if (!content) return;

        switch (action) {
            case 'gras':
                content.style.fontWeight = content.style.fontWeight === 'bold' ? 'normal' : 'bold';
                break;
            case 'italique':
                content.style.fontStyle = content.style.fontStyle === 'italic' ? 'normal' : 'italic';
                break;
            case 'alignement gauche':
                content.style.textAlign = 'left';
                break;
            case 'alignement centre':
                content.style.textAlign = 'center';
                break;
            case 'alignement droite':
                content.style.textAlign = 'right';
                break;
        }
    }

    // Gestionnaire pour l'assistant virtuel
    const assistant = document.querySelector('.virtual-assistant');
    const nextTipBtn = document.getElementById('next-tip');
    const disableAssistantBtn = document.getElementById('disable-assistant');
    let currentStep = 1;

    const tips = [
        "Bienvenue ! Donnez un titre accrocheur à votre page pour commencer.",
        "Ajoutez des images, vidéos ou textes pour enrichir votre page.",
        "Personnalisez les couleurs, la mise en page et le style selon vos envies.",
        "Finalisez votre page : vérifiez le rendu, sauvegardez ou partagez-la !"
    ];

    function updateAssistant() {
        const message = assistant.querySelector('.assistant-message');
        message.textContent = tips[currentStep - 1];
        // Afficher ou masquer le bouton suivant selon l'étape
        if (currentStep === tips.length) {
            nextTipBtn.textContent = 'Terminer';
        } else {
            nextTipBtn.textContent = 'Suivant →';
        }
    }

    nextTipBtn.addEventListener('click', () => {
        if (currentStep < tips.length) {
            currentStep++;
            updateAssistant();
        } else {
            // À la dernière étape, fermer l'assistant
            assistant.style.display = 'none';
        }
    });

    disableAssistantBtn.addEventListener('click', () => {
        assistant.style.display = 'none';
    });

    // Fonction pour créer des blocs prédéfinis
    function createPredefinedBlock(type, x, y) {
        let content = '';
        switch (type) {
            case 'hero-dramatic':
                content = `
                    <div class="hero-block" style="background: linear-gradient(45deg, #2c3e50, #34495e); color: white; padding: 2rem; text-align: center;">
                        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Titre Accrocheur</h1>
                        <p style="font-size: 1.2rem;">Sous-titre percutant</p>
                    </div>
                `;
                break;
            case 'testimonial':
                content = `
                    <div class="testimonial-block" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
                        <img src="https://via.placeholder.com/100" alt="Photo" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 1rem;">
                        <blockquote style="font-style: italic; margin-bottom: 1rem;">"Une citation émouvante qui touche le cœur."</blockquote>
                        <p style="font-weight: bold;">- Auteur</p>
                    </div>
                `;
                break;
            case 'quote':
                content = `
                    <div class="quote-block" style="text-align: center; padding: 2rem;">
                        <h2 style="font-size: 2rem; margin-bottom: 1rem;">"Une phrase percutante"</h2>
                        <p style="font-style: italic;">- Citation mémorable</p>
                    </div>
                `;
                break;
            case 'footer':
                content = `
                    <div class="footer-block" style="background: #2c3e50; color: white; padding: 2rem; text-align: center;">
                        <h3 style="margin-bottom: 1rem;">Conclusion Mémorable</h3>
                        <p>Un dernier message qui restera gravé</p>
                    </div>
                `;
                break;
            case 'presentation':
                content = `
                    <div class="presentation-block" style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px;">
                        <h2>Présentation</h2>
                        <p>Bonjour, je m'appelle <strong>Votre Nom</strong> et je vous présente mon projet !</p>
                    </div>
                `;
                break;
            case 'list':
                content = `
                    <div class="list-block" style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px;">
                        <h3>Liste de points importants</h3>
                        <ul>
                            <li>Premier point clé</li>
                            <li>Deuxième point clé</li>
                            <li>Troisième point clé</li>
                        </ul>
                    </div>
                `;
                break;
            case 'contact':
                content = `
                    <div class="contact-block" style="background: #fffbe6; padding: 1.5rem; border-radius: 8px; border: 1px solid #ffe082;">
                        <h3>Contact</h3>
                        <p>Email : <a href="mailto:exemple@email.com">exemple@email.com</a></p>
                        <p>Téléphone : 06 12 34 56 78</p>
                    </div>
                `;
                break;
            case 'inspiration-quote':
                content = `
                    <div class="inspiration-quote-block" style="background: #f0f4c3; padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <blockquote style="font-size: 1.3rem; font-style: italic;">"Le succès n'est pas la clé du bonheur. Le bonheur est la clé du succès."</blockquote>
                        <p>- Albert Schweitzer</p>
                    </div>
                `;
                break;
            case 'image-caption':
                content = `
                    <div class="image-caption-block" style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <img src="https://via.placeholder.com/300x200" alt="Image illustrative" style="max-width: 100%; border-radius: 6px; margin-bottom: 0.5rem;">
                        <div class="caption" style="color: #555; font-size: 1rem;">Légende de l'image</div>
                    </div>
                `;
                break;
        }

        const element = document.createElement('div');
        element.className = 'canvas-element';
        element.style.position = 'absolute';
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        element.innerHTML = content;

        // Ajouter les contrôles
        const controls = document.createElement('div');
        controls.className = 'element-controls';
        controls.innerHTML = `
            <div class="control-btn edit-btn" title="Modifier"><i class="fas fa-edit"></i></div>
            <div class="control-btn delete-btn" title="Supprimer"><i class="fas fa-trash"></i></div>
        `;
        element.appendChild(controls);

        canvas.appendChild(element);
        addMiniToolbar(element);
        makeElementDraggable(element);
        makeElementResizable(element);
        playSound('add');
    }

    // Ajout d'un aperçu visuel à côté des inputs couleur
    function addColorPreview(inputId, color) {
        const input = document.getElementById(inputId);
        if (!input) return;
        let preview = input.parentElement.querySelector('.color-preview');
        if (!preview) {
            preview = document.createElement('span');
            preview.className = 'color-preview';
            preview.style.display = 'inline-block';
            preview.style.width = '24px';
            preview.style.height = '24px';
            preview.style.marginLeft = '8px';
            preview.style.borderRadius = '6px';
            preview.style.border = '1px solid #ccc';
            preview.style.verticalAlign = 'middle';
            input.parentElement.appendChild(preview);
        }
        preview.style.background = color;
    }

    function bindLiveStyleProperties(element) {
        const bgColorInput = document.getElementById('element-bg-color');
        const textColorInput = document.getElementById('element-text-color');
        const headingFontSizeInput = document.getElementById('heading-font-size');
        const headingTextInput = document.getElementById('heading-text');
        const paragraphTextInput = document.getElementById('paragraph-text');
        const paragraphFontSizeInput = document.getElementById('paragraph-font-size');
        // Couleur de fond (déjà géré)
        if (bgColorInput) {
            addColorPreview('element-bg-color', bgColorInput.value);
            bgColorInput.addEventListener('input', (e) => {
                element.style.backgroundColor = e.target.value;
                addColorPreview('element-bg-color', e.target.value);
            });
        }
        // Couleur du texte (réactif sur balise)
        if (textColorInput) {
            addColorPreview('element-text-color', textColorInput.value);
            textColorInput.addEventListener('input', (e) => {
                const color = e.target.value;
                // Titre
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) heading.style.color = color;
                // Paragraphe
                const p = element.querySelector('p');
                if (p) p.style.color = color;
                addColorPreview('element-text-color', color);
            });
        }
        // Taille du titre (réactif)
        if (headingFontSizeInput) {
            headingFontSizeInput.addEventListener('input', (e) => {
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) heading.style.fontSize = e.target.value + 'px';
            });
        }
        // Modification du texte du paragraphe en live
        if (paragraphTextInput) {
            paragraphTextInput.addEventListener('input', (e) => {
                const p = element.querySelector('p');
                if (p) p.innerText = e.target.value;
            });
        }
        // Gestion réactive de la taille de police pour les paragraphes
        if (paragraphFontSizeInput) {
            paragraphFontSizeInput.addEventListener('input', (e) => {
                const p = element.querySelector('p');
                if (p) p.style.fontSize = e.target.value + 'px';
            });
        }
        // Titres
        const headingFontFamilyInput = document.getElementById('heading-font-family');
        const headingBoldBtn = document.getElementById('heading-bold');
        const headingItalicBtn = document.getElementById('heading-italic');
        const headingUnderlineBtn = document.getElementById('heading-underline');
        const headingStrikeBtn = document.getElementById('heading-strike');
        if (headingFontFamilyInput) {
            headingFontFamilyInput.addEventListener('change', (e) => {
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) heading.style.fontFamily = e.target.value;
            });
        }
        if (headingBoldBtn) {
            headingBoldBtn.addEventListener('click', () => {
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) {
                    heading.style.fontWeight = heading.style.fontWeight === 'bold' ? 'normal' : 'bold';
                    headingBoldBtn.classList.toggle('active');
                }
            });
        }
        if (headingItalicBtn) {
            headingItalicBtn.addEventListener('click', () => {
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) {
                    heading.style.fontStyle = heading.style.fontStyle === 'italic' ? 'normal' : 'italic';
                    headingItalicBtn.classList.toggle('active');
                }
            });
        }
        if (headingUnderlineBtn) {
            headingUnderlineBtn.addEventListener('click', () => {
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) {
                    const deco = heading.style.textDecoration || '';
                    if (deco.includes('underline')) {
                        heading.style.textDecoration = deco.replace('underline', '').replace('  ', ' ').trim();
                        headingUnderlineBtn.classList.remove('active');
                    } else {
                        heading.style.textDecoration = (deco + ' underline').trim();
                        headingUnderlineBtn.classList.add('active');
                    }
                }
            });
        }
        if (headingStrikeBtn) {
            headingStrikeBtn.addEventListener('click', () => {
                const heading = element.querySelector('h1, h2, h3, h4');
                if (heading) {
                    const deco = heading.style.textDecoration || '';
                    if (deco.includes('line-through')) {
                        heading.style.textDecoration = deco.replace('line-through', '').replace('  ', ' ').trim();
                        headingStrikeBtn.classList.remove('active');
                    } else {
                        heading.style.textDecoration = (deco + ' line-through').trim();
                        headingStrikeBtn.classList.add('active');
                    }
                }
            });
        }
        // Paragraphes
        const paragraphFontFamilyInput = document.getElementById('paragraph-font-family');
        const paragraphBoldBtn = document.getElementById('paragraph-bold');
        const paragraphItalicBtn = document.getElementById('paragraph-italic');
        const paragraphUnderlineBtn = document.getElementById('paragraph-underline');
        const paragraphStrikeBtn = document.getElementById('paragraph-strike');
        if (paragraphFontFamilyInput) {
            paragraphFontFamilyInput.addEventListener('change', (e) => {
                const p = element.querySelector('p');
                if (p) p.style.fontFamily = e.target.value;
            });
        }
        if (paragraphBoldBtn) {
            paragraphBoldBtn.addEventListener('click', () => {
                const p = element.querySelector('p');
                if (p) {
                    p.style.fontWeight = p.style.fontWeight === 'bold' ? 'normal' : 'bold';
                    paragraphBoldBtn.classList.toggle('active');
                }
            });
        }
        if (paragraphItalicBtn) {
            paragraphItalicBtn.addEventListener('click', () => {
                const p = element.querySelector('p');
                if (p) {
                    p.style.fontStyle = p.style.fontStyle === 'italic' ? 'normal' : 'italic';
                    paragraphItalicBtn.classList.toggle('active');
                }
            });
        }
        if (paragraphUnderlineBtn) {
            paragraphUnderlineBtn.addEventListener('click', () => {
                const p = element.querySelector('p');
                if (p) {
                    const deco = p.style.textDecoration || '';
                    if (deco.includes('underline')) {
                        p.style.textDecoration = deco.replace('underline', '').replace('  ', ' ').trim();
                        paragraphUnderlineBtn.classList.remove('active');
                    } else {
                        p.style.textDecoration = (deco + ' underline').trim();
                        paragraphUnderlineBtn.classList.add('active');
                    }
                }
            });
        }
        if (paragraphStrikeBtn) {
            paragraphStrikeBtn.addEventListener('click', () => {
                const p = element.querySelector('p');
                if (p) {
                    const deco = p.style.textDecoration || '';
                    if (deco.includes('line-through')) {
                        p.style.textDecoration = deco.replace('line-through', '').replace('  ', ' ').trim();
                        paragraphStrikeBtn.classList.remove('active');
                    } else {
                        p.style.textDecoration = (deco + ' line-through').trim();
                        paragraphStrikeBtn.classList.add('active');
                    }
                }
            });
        }
    }

    // Ajout : popup hover pour les boutons avec URL
    function openButtonPopup(url) {
        // Correction : préfixer l'URL si besoin
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        // Supprimer toute popup existante
        let existing = document.getElementById('button-popup-modal');
        if (existing) existing.remove();
        // Créer la popup
        const modal = document.createElement('div');
        modal.id = 'button-popup-modal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.width = '80vw';
        modal.style.height = '80vh';
        modal.style.background = '#fff';
        modal.style.borderRadius = '12px';
        modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
        modal.style.zIndex = '9999';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        // Bouton fermer
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✖';
        closeBtn.style.alignSelf = 'flex-end';
        closeBtn.style.margin = '12px 16px 0 0';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '1.5rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => modal.remove();
        // Iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.flex = '1';
        iframe.style.width = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '0 0 12px 12px';
        // Gestion d'erreur de chargement
        let errorShown = false;
        iframe.onerror = iframe.onload = function () {
            // Si l'iframe reste vide après 1s, afficher l'erreur
            setTimeout(() => {
                if (!iframe.contentDocument || iframe.contentDocument.body.innerHTML === '' || iframe.contentWindow.location.href === 'about:blank') {
                    if (!errorShown) {
                        errorShown = true;
                        iframe.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.style.flex = '1';
                        errorDiv.style.display = 'flex';
                        errorDiv.style.flexDirection = 'column';
                        errorDiv.style.justifyContent = 'center';
                        errorDiv.style.alignItems = 'center';
                        errorDiv.innerHTML = `<p style='color:#c0392b;font-size:1.2rem;margin-bottom:1rem;'>Impossible d'afficher ce site dans une popup.<br>Ce site interdit l'affichage en iframe.</p>`;
                        const openBtn = document.createElement('button');
                        openBtn.textContent = 'Ouvrir dans un nouvel onglet';
                        openBtn.style.background = '#3498db';
                        openBtn.style.color = '#fff';
                        openBtn.style.padding = '10px 20px';
                        openBtn.style.border = 'none';
                        openBtn.style.borderRadius = '8px';
                        openBtn.style.fontSize = '1rem';
                        openBtn.style.cursor = 'pointer';
                        openBtn.onclick = () => { window.open(url, '_blank'); };
                        errorDiv.appendChild(openBtn);
                        modal.appendChild(errorDiv);
                    }
                }
            }, 1000);
        };
        modal.appendChild(closeBtn);
        modal.appendChild(iframe);
        document.body.appendChild(modal);
    }

    // Ajouter l'écouteur d'événement pour le bouton de fermeture
    document.addEventListener('click', function (event) {
        if (event.target.id === 'close-preview') {
            previewModal.style.display = 'none';
        }
    });

    // Fusionner les deux déclarations de style en une seule
    const style = document.createElement('style');
    style.textContent = `
        #fullscreen-preview.mobile-mode {
            background-color: black;
        }
        .mini-toolbar {
            display: none;
        }
    `;
    document.head.appendChild(style);

    shareModal.style.display = 'none';
    showDefaultProperties();

    // Gestion de la réinitialisation
    resetBtn.addEventListener('click', () => {
        resetConfirm.style.display = 'flex';
    });

    resetCancel.addEventListener('click', () => {
        resetConfirm.style.display = 'none';
    });

    resetConfirmBtn.addEventListener('click', () => {
        // Supprimer tous les éléments du canvas
        const canvasElements = canvas.querySelectorAll('.canvas-element');
        canvasElements.forEach(element => element.remove());

        // Réinitialiser le compteur d'éléments
        elementCounter = 0;

        // Réinitialiser l'élément sélectionné
        selectedElement = null;

        // Réinitialiser le panneau de propriétés
        showDefaultProperties();

        // Ajouter le texte d'espace réservé
        canvas.innerHTML = '<div class="placeholder-text">Glissez et déposez des éléments ici pour créer votre page</div>';

        // Fermer la modal de confirmation
        resetConfirm.style.display = 'none';

        // Jouer le son de sauvegarde
        playSound('save');
    });
});