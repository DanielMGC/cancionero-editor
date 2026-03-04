<script lang="ts">
    import type { Song } from '$lib/types';

    export let song: Song;
    export let isNew: boolean;
    export let onSave: (updatedSong: Song) => void;
    export let onCancel: () => void;
    export let onDelete: (songNumber: number) => void;
    
    export let originalNumber: number | null;
    export let existingNumbers: number[];
    export let categories: string[];

    export let currentTab: 'canciones' | 'oraciones';

    let formData: Song = { ...song };
    let errorMessage = '';

    function cleanRichText(html: string) {
        if (!html) return '';
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const elements = doc.body.querySelectorAll('*');
        elements.forEach((el) => {
            for (let i = el.attributes.length - 1; i >= 0; i--) {
                const attr = el.attributes[i].name;
                if (!(el.tagName === 'A' && attr === 'href')) {
                    el.removeAttribute(attr);
                }
            }

            const tagsToUnwrap = ['SPAN', 'FONT', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
            if (tagsToUnwrap.includes(el.tagName)) {
                const fragment = document.createDocumentFragment();
                while (el.firstChild) {
                    fragment.appendChild(el.firstChild);
                }
                if (el.parentNode) {
                    el.parentNode.replaceChild(fragment, el);
                }
            }
        });

        return doc.body.innerHTML;
    }

    function handlePaste(e: ClipboardEvent) {
        e.preventDefault();
        const clipboardData = e.clipboardData;
        if (!clipboardData) return;

        const html = clipboardData.getData('text/html');
        const text = clipboardData.getData('text/plain');

        if (html) {
            const sanitized = cleanRichText(html);
            document.execCommand('insertHTML', false, sanitized);
        } else {
            const formattedText = text.replace(/\n/g, '<br>');
            document.execCommand('insertHTML', false, formattedText);
        }
    }

    function handleSubmit() {
        const isDuplicate = isNew 
            ? existingNumbers.includes(formData.number)
            : (formData.number !== originalNumber && existingNumbers.includes(formData.number));

        if (isDuplicate) {
            errorMessage = `El número ${formData.number} ya existe. Por favor, elige un número diferente.`;
            return;
        }

        errorMessage = '';
        formData.text = cleanRichText(formData.text);
        
        onSave(formData);
    }

    // --- NEW: Safe Cancel Logic ---
    function handleCancelClick() {
        // Compare the current form state to the original song data
        const hasChanges = JSON.stringify(formData) !== JSON.stringify(song);
        
        if (hasChanges) {
            const confirmLeave = confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cancelar y perder estos cambios?');
            if (!confirmLeave) {
                return; // User chose to stay
            }
        }
        
        onCancel(); // Proceed with cancel
    }

    function formatText(command: string, value: string | undefined = undefined) {
        document.execCommand(command, false, value);
    }

    function addLink() {
        const url = prompt('Por favor ingresa la URL del enlace (ej. https://youtube.com/...):', 'https://');
        if (url) {
            formatText('createLink', url);
        }
    }

    function removeLink() {
        formatText('unlink');
    }
</script>

<div class="editor-container">
    
    <h2>
        {isNew ? 'Agregar ' : 'Editar '}
        {currentTab === 'canciones' ? 'Canción' : 'Oración'}
    </h2>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="number">Número</label>
            <input id="number" type="number" bind:value={formData.number} required />
        </div>

        <div class="form-group">
            <label for="category">Categoría</label>
            <input id="category" type="text" bind:value={formData.category} list="category-options" required />
            <datalist id="category-options">
                {#each categories as cat}
                    <option value={cat}></option>
                {/each}
            </datalist>
        </div>

        <div class="form-group">
            <label for="title">Título</label>
            <input id="title" type="text" bind:value={formData.title} required />
        </div>

        <div class="form-group">
            <label for="author">Autor</label>
            <input id="author" type="text" bind:value={formData.author} />
        </div>

        <div class="form-group">
            <label>Texto</label>
            <div class="rich-text-container">
                <div class="toolbar">
                    <button type="button" class="tool-btn" on:click={() => formatText('bold')} title="Bold"><b>B</b></button>
                    <button type="button" class="tool-btn" on:click={() => formatText('italic')} title="Italic"><i>I</i></button>
                    <button type="button" class="tool-btn" on:click={() => formatText('underline')} title="Underline"><u>U</u></button>
                    <div class="divider"></div>
                    <button type="button" class="tool-btn link-btn" on:click={addLink} title="Agregar Enlace">🔗 Link</button>
                    <button type="button" class="tool-btn link-btn" on:click={removeLink} title="Eliminar Enlace">❌ Unlink</button>
                </div>
                <div 
                    class="rich-text-input" 
                    contenteditable="true" 
                    bind:innerHTML={formData.text}
                    on:paste={handlePaste}
                ></div>
            </div>
        </div>

        {#if errorMessage}
            <div class="error-banner">{errorMessage}</div>
        {/if}

        <div class="actions">
            <button type="submit" class="btn btn-save">Guardar</button>
            <button type="button" class="btn btn-cancel" on:click={handleCancelClick}>Cancelar</button>
            {#if !isNew}
                <button type="button" class="btn btn-delete" on:click={() => onDelete(originalNumber || formData.number)}>Eliminar</button>
            {/if}
        </div>
    </form>
</div>

<style>
    /* Keep all your existing CSS exactly as it was. 
       No styling changes are required for this update!
    */
    .editor-container {
        max-width: 800px;
        margin: 0 auto;
        background: #fff;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .error-banner {
        background-color: #ffebee;
        color: #c62828;
        padding: 1rem;
        border-radius: 4px;
        margin-bottom: 1rem;
        font-weight: bold;
        border: 1px solid #ef9a9a;
        text-align: center;
    }

    .form-group {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }
    label {
        margin-bottom: 0.5rem;
        font-weight: bold;
        color: #333;
    }
    input {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
    }
    
    .rich-text-container {
        border: 1px solid #ccc;
        border-radius: 4px;
        overflow: hidden;
    }
    .toolbar {
        background: #f4f4f4;
        padding: 0.5rem;
        border-bottom: 1px solid #ccc;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    .divider {
        width: 1px;
        height: 20px;
        background-color: #ccc;
        margin: 0 0.25rem;
    }
    .tool-btn {
        background: white;
        border: 1px solid #ddd;
        border-radius: 3px;
        padding: 0.25rem 0.5rem;
        cursor: pointer;
        font-size: 1rem;
    }
    .link-btn {
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .tool-btn:hover {
        background: #e9e9e9;
    }
    .rich-text-input {
        min-height: 200px;
        padding: 1rem;
        outline: none;
        background: #fff;
        overflow-y: auto;
    }
    .rich-text-input:focus {
        background: #fafafa;
    }
    
    :global(.rich-text-input a) {
        color: #1a73e8;
        text-decoration: underline;
        cursor: pointer;
    }

    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 1rem;
        flex-wrap: wrap;
    }
    .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        flex: 1;
        min-width: 120px;
    }
    .btn-save { background: #4CAF50; color: white; }
    .btn-cancel { background: #9e9e9e; color: white; }
    .btn-delete { background: #f44336; color: white; margin-left: auto; }

    @media (max-width: 600px) {
        .btn-delete { margin-left: 0; }
    }
</style>