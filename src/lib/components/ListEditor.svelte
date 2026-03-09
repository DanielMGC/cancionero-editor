<script lang="ts">
    import type { Lista, Song } from '$lib/types';

    export let lista: Lista;
    export let isNew: boolean;
    export let onSave: (updatedLista: Lista) => void;
    export let onCancel: () => void;
    export let onDelete: (listNumber: number) => void;
    
    export let originalNumber: number | null;
    export let existingNumbers: number[];
    export let canciones: Song[];
    export let oraciones: Song[];

    let formData: Lista = { ...lista, elements: [...(lista.elements || [])] };
    let errorMessage = '';

    // --- NEW: ID Generator for Svelte Tracking ---
    function generateId() {
        return Math.random().toString(36).substring(2, 9);
    }

    // --- UPDATED: Added an 'id' property to each element ---
    let localElements: { id: string, type: 'cancion' | 'oracion', value: string }[] = formData.elements.map(id => {
        if (id > 10000) {
            const o = oraciones.find(x => x.number === id - 10000);
            return { id: generateId(), type: 'oracion', value: o ? `${o.number} - ${o.title}` : '' };
        } else {
            const c = canciones.find(x => x.number === id);
            return { id: generateId(), type: 'cancion', value: c ? `${c.number} - ${c.title}` : '' };
        }
    });

    function addElement(type: 'cancion' | 'oracion') {
        localElements = [...localElements, { id: generateId(), type, value: '' }];
    }

    function removeElement(index: number) {
        localElements = localElements.filter((_, i) => i !== index);
    }

    // --- NEW: Drag and Drop Logic ---
    let draggedIndex: number | null = null;

    function handleDragStart(event: DragEvent, index: number) {
        draggedIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            // Firefox requires data to be set for the drag to work
            event.dataTransfer.setData('text/plain', index.toString());
        }
    }

    function handleDrop(event: DragEvent, index: number) {
        event.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            // Swap the items in the array
            const newElements = [...localElements];
            const [movedItem] = newElements.splice(draggedIndex, 1);
            newElements.splice(index, 0, movedItem);
            localElements = newElements;
        }
        draggedIndex = null;
    }

    function handleDragOver(event: DragEvent) {
        // This is required to allow dropping on an element
        event.preventDefault(); 
    }

    function handleSubmit() {
        const isDuplicate = isNew 
            ? existingNumbers.includes(formData.number)
            : (formData.number !== originalNumber && existingNumbers.includes(formData.number));

        if (isDuplicate) {
            errorMessage = `El número ${formData.number} ya existe. Por favor, elige un número diferente.`;
            return;
        }

        formData.elements = localElements.map(el => {
            const num = parseInt(el.value.split(' - ')[0]);
            if (isNaN(num)) return null;
            return el.type === 'oracion' ? num + 10000 : num;
        }).filter(n => n !== null) as number[];

        errorMessage = '';
        onSave(formData);
    }

    function handleCancelClick() {
        onCancel();
    }
</script>

<div class="editor-container">
    <h2>{isNew ? 'Agregar Lista' : 'Editar Lista'}</h2>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="number">Número de Lista</label>
            <input id="number" type="number" bind:value={formData.number} required />
        </div>

        <div class="form-group">
            <label for="title">Título de la Lista</label>
            <input id="title" type="text" bind:value={formData.title} required />
        </div>

        <div class="form-group elements-section">
            <label>Elementos de la Lista</label>
            
            {#each localElements as element, index (element.id)}
                <div 
                    class="element-row"
                    class:dragging={draggedIndex === index}
                    draggable="true"
                    on:dragstart={(e) => handleDragStart(e, index)}
                    on:drop={(e) => handleDrop(e, index)}
                    on:dragover={handleDragOver}
                >
                    <div class="drag-handle" title="Arrastrar para reordenar">☰</div>

                    <span class="element-badge {element.type}">{element.type === 'cancion' ? '🎵' : '📖'}</span>
                    
                    <input 
                        type="text" 
                        bind:value={element.value} 
                        list="{element.type}-options" 
                        placeholder="Buscar {element.type}..." 
                        required 
                    />
                    
                    <button type="button" class="btn-remove" on:click={() => removeElement(index)} title="Remover">
                        &times;
                    </button>
                </div>
            {/each}

            <datalist id="cancion-options">
                {#each canciones as c}
                    <option value="{c.number} - {c.title}"></option>
                {/each}
            </datalist>
            <datalist id="oracion-options">
                {#each oraciones as o}
                    <option value="{o.number} - {o.title}"></option>
                {/each}
            </datalist>

            <div class="add-buttons">
                <button type="button" class="btn-add cancion" on:click={() => addElement('cancion')}>+ Canción</button>
                <button type="button" class="btn-add oracion" on:click={() => addElement('oracion')}>+ Oración</button>
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
    .editor-container { max-width: 800px; margin: 0 auto; background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .error-banner { background-color: #ffebee; color: #c62828; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; font-weight: bold; border: 1px solid #ef9a9a; text-align: center; }
    .form-group { margin-bottom: 1.5rem; display: flex; flex-direction: column; }
    label { margin-bottom: 0.5rem; font-weight: bold; color: #333; }
    input { padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    
    .elements-section { background: #f9f9f9; padding: 1rem; border-radius: 8px; border: 1px solid #eee; }
    
    /* UPDATED: Added transition and dragging styles */
    .element-row { 
        display: flex; 
        align-items: center; 
        gap: 0.5rem; 
        margin-bottom: 0.75rem; 
        background: white;
        padding: 0.25rem;
        border-radius: 6px;
        border: 1px solid transparent;
        transition: all 0.2s ease;
    }
    .element-row.dragging {
        opacity: 0.5;
        background: #e9ecef;
        border: 1px dashed #999;
    }

    /* NEW: Drag Handle Styles */
    .drag-handle {
        cursor: grab;
        font-size: 1.5rem;
        color: #aaa;
        padding: 0 0.5rem;
        user-select: none;
    }
    .drag-handle:active {
        cursor: grabbing;
    }

    .element-row input { flex: 1; margin: 0; }
    .element-badge { font-size: 1.2rem; }
    
    .btn-remove { background: #ff4d4d; color: white; border: none; border-radius: 4px; width: 35px; height: 35px; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .btn-remove:hover { background: #cc0000; }
    
    .add-buttons { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-add { padding: 0.5rem 1rem; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; flex: 1; }
    .btn-add.cancion { background: #e3f2fd; color: #1565c0; border: 1px solid #bbdefb; }
    .btn-add.oracion { background: #f3e5f5; color: #6a1b9a; border: 1px solid #e1bee7; }
    
    .actions { display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
    .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; flex: 1; min-width: 120px; }
    .btn-save { background: #4CAF50; color: white; }
    .btn-cancel { background: #9e9e9e; color: white; }
    .btn-delete { background: #f44336; color: white; margin-left: auto; }
</style>