<script lang="ts">
    import type { Song, Lista } from '$lib/types';

    // We accept both arrays now so we can resolve names
    export let items: any[] = []; 
    export let canciones: Song[] = [];
    export let oraciones: Song[] = [];
    
    export let onEdit: (item: any) => void;
    export let onAdd: () => void;
    
    export let searchQuery = '';
    export let currentTab: 'canciones' | 'oraciones' | 'listas';

    let localQuery = searchQuery;
    let debounceTimer: ReturnType<typeof setTimeout>;

    $: if (searchQuery === '') localQuery = '';

    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            searchQuery = localQuery;
        }, 300); 
    }

    function clearSearch() {
        localQuery = '';
        searchQuery = '';
    }

    // Helper to resolve Lista elements into a readable string
    function getListaContent(elements: number[]) {
        if (!elements || elements.length === 0) return 'Vacía';
        return elements.map(id => {
            if (id > 10000) {
                return oraciones.find(o => o.number === id - 10000)?.title || '...';
            }
            return canciones.find(c => c.number === id)?.title || '...';
        }).join(', ');
    }

    $: filteredItems = items.filter(item => {
        const query = searchQuery.toLowerCase();
        if (currentTab === 'listas') {
            const contentString = getListaContent(item.elements).toLowerCase();
            return item.title.toLowerCase().includes(query) || 
                   item.number.toString().includes(query) ||
                   contentString.includes(query);
        } else {
            return item.title.toLowerCase().includes(query) ||
                   item.text.toLowerCase().includes(query) ||
                   item.number.toString().includes(query);
        }
    });

    // 1. Explicitly tell TypeScript this will always be an object with string keys and array values
    let groupedItems: Record<string, any[]> = {};

    // 2. Use a reactive block to update it safely
    $: {
        if (currentTab === 'listas') {
            groupedItems = { 'Mis Listas': filteredItems };
        } else {
            groupedItems = filteredItems.reduce((acc, song) => {
                const cat = song.category || 'Sin Categoría';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(song);
                return acc;
            }, {} as Record<string, any[]>);
        }
    }
</script>

<div class="sticky-header">
    <slot name="tabs"></slot>

    <div class="header">
        <h1>Cancionero Nuestra Señora del Carmen - Editor</h1>
        <button class="add-btn" on:click={onAdd}>
            + Nueva {currentTab === 'canciones' ? 'canción' : currentTab === 'oraciones' ? 'oración' : 'lista'}
        </button>
    </div>

    <div class="search-container">
        <div class="input-wrapper">
            <input type="text" class="search-input" bind:value={localQuery} on:input={handleInput} placeholder="Buscar..." />
            {#if localQuery.length > 0}
                <button class="clear-btn" on:click={clearSearch}>&times;</button>
            {/if}
        </div>
    </div>
</div>

{#if Object.keys(groupedItems).length === 0}
    <div class="empty-state">
        <p>No se encontraron resultados para "{searchQuery}"</p>
    </div>
{:else}
    {#each Object.entries(groupedItems) as [category, categoryItems]}
        {#if currentTab !== 'listas'}
            <h2 class="category-title">{category}</h2>
        {/if}
        
        <div class="grid-header desktop-only">
            <div class="col-num">#</div>
            <div class="col-title">Título</div>
            <div class="col-text">{currentTab === 'listas' ? 'Contenido' : 'Texto'}</div>
        </div>

        <div class="grid-container">
            {#each categoryItems as item}
                <div class="grid-row" on:click={() => onEdit(item)}>
                    <div class="col-num"><span class="mobile-label">#: </span>{item.number}</div>
                    <div class="col-title"><span class="mobile-label">Título: </span>{item.title}</div>
                    
                    <div class="col-text">
                        {#if currentTab === 'listas'}
                            {getListaContent(item.elements)}
                        {:else}
                            {@html item.text}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/each}
{/if}

<style>
    /* Paste your existing SongList.svelte CSS here exactly as it was! */
    .sticky-header { position: sticky; top: 0; background-color: #f0f2f5; z-index: 10; padding-top: 1rem; padding-bottom: 0.5rem; margin-top: -1rem; border-bottom: 1px solid #ddd; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .add-btn { background: #4CAF50; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
    .add-btn:hover { background: #45a049; }
    .search-container { margin-bottom: 1rem; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .search-input { width: 100%; padding: 0.75rem 2.5rem 0.75rem 1rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); }
    .search-input:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); }
    .clear-btn { position: absolute; right: 0.5rem; background: none; border: none; font-size: 1.5rem; color: #888; cursor: pointer; line-height: 1; padding: 0 0.5rem; }
    .empty-state { text-align: center; padding: 3rem; color: #666; background: #fff; border-radius: 8px; border: 1px dashed #ccc; margin-top: 2rem; }
    .category-title { border-bottom: 2px solid #ccc; margin-top: 1.5rem; padding-bottom: 0.5rem; color: #333; }
    .grid-container { display: flex; flex-direction: column; gap: 0.5rem; }
    .grid-header, .grid-row { display: grid; grid-template-columns: 60px 1.5fr 3fr; gap: 1rem; padding: 0.75rem; border-radius: 4px; }
    .grid-header { font-weight: bold; background: #e9ecef; border-bottom: none; }
    .grid-row { background: #fff; border: 1px solid #ddd; cursor: pointer; transition: all 0.2s ease; }
    .grid-row:hover { background: #f8f9fa; border-color: #adb5bd; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .col-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #666; font-size: 0.9rem; }
    .mobile-label { display: none; font-weight: bold; color: #555; }
    @media (max-width: 600px) { .desktop-only { display: none; } .grid-row { grid-template-columns: 1fr; gap: 0.5rem; } .mobile-label { display: inline; } .col-text { -webkit-line-clamp: 3; } }
</style>