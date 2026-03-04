<script lang="ts">
    import type { Song } from '$lib/types';

    export let songs: Song[] = [];
    export let onEdit: (song: Song) => void;
    export let onAdd: () => void;
    
    export let searchQuery = '';
    export let currentTab: 'canciones' | 'oraciones';

    // --- NEW: Debounce State ---
    let localQuery = searchQuery; // Binds to the input so typing is instant
    let debounceTimer: ReturnType<typeof setTimeout>;

    // Keep the local query in sync if the parent resets the search (e.g., when switching tabs)
    $: if (searchQuery === '') {
        localQuery = '';
    }

    // --- NEW: Debounce Function ---
    function handleInput() {
        clearTimeout(debounceTimer);
        // Wait 300ms after the user stops typing before updating the actual search
        debounceTimer = setTimeout(() => {
            searchQuery = localQuery;
        }, 300); 
    }

    // --- NEW: Clear Function ---
    function clearSearch() {
        localQuery = '';
        searchQuery = '';
    }

    $: filteredSongs = songs.filter(song => {
        const query = searchQuery.toLowerCase();
        return (
            song.title.toLowerCase().includes(query) ||
            song.text.toLowerCase().includes(query) ||
            song.number.toString().includes(query)
        );
    });

    $: groupedSongs = filteredSongs.reduce((acc, song) => {
        const cat = song.category || 'Sin Categoría';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(song);
        return acc;
    }, {} as Record<string, Song[]>);
</script>

<div class="sticky-header">
    <slot name="tabs"></slot>

    <div class="header">
        <h1>Cancionero Nuestra Señora del Carmen - Editor</h1>
        <button class="add-btn" on:click={onAdd}>
            + Nueva {currentTab === 'canciones' ? 'canción' : 'oración'}
        </button>
    </div>

    <div class="search-container">
        <div class="input-wrapper">
            <input 
                type="text" 
                class="search-input" 
                bind:value={localQuery} 
                on:input={handleInput}
                placeholder="Buscar por título, letra o número..." 
            />
            {#if localQuery.length > 0}
                <button class="clear-btn" on:click={clearSearch} aria-label="Limpiar búsqueda">
                    &times;
                </button>
            {/if}
        </div>
    </div>
</div>

{#if Object.keys(groupedSongs).length === 0}
    <div class="empty-state">
        <p>No se encontraron {currentTab} que coincidan con "{searchQuery}"</p>
    </div>
{:else}
    {#each Object.entries(groupedSongs) as [category, catSongs]}
        <h2 class="category-title">{category}</h2>
        
        <div class="grid-header desktop-only">
            <div class="col-num">#</div>
            <div class="col-title">Título</div>
            <div class="col-text">Texto</div>
        </div>

        <div class="grid-container">
            {#each catSongs as song}
                <div class="grid-row" on:click={() => onEdit(song)}>
                    <div class="col-num"><span class="mobile-label">#: </span>{song.number}</div>
                    <div class="col-title"><span class="mobile-label">Título: </span>{song.title}</div>
                    <div class="col-text">{@html song.text}</div>
                </div>
            {/each}
        </div>
    {/each}
{/if}

<style>
    /* ... (Keep all your existing CSS exactly as it was) ... */
    .sticky-header {
        position: sticky;
        top: 0;
        background-color: #f0f2f5;
        z-index: 10;
        padding-top: 1rem;
        padding-bottom: 0.5rem;
        margin-top: -1rem;
        border-bottom: 1px solid #ddd;
    }
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .add-btn {
        background: #4CAF50;
        color: white;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background 0.2s;
    }
    .add-btn:hover { background: #45a049; }
    .search-container { margin-bottom: 1rem; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .search-input { width: 100%; padding: 0.75rem 2.5rem 0.75rem 1rem; font-size: 1rem; border: 1px solid #ccc; border-radius: 4px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); background-color: #fff; }
    .search-input:focus { outline: none; border-color: #4CAF50; box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); }
    .clear-btn { position: absolute; right: 0.5rem; background: none; border: none; font-size: 1.5rem; color: #888; cursor: pointer; line-height: 1; padding: 0 0.5rem; }
    .clear-btn:hover { color: #333; }
    .empty-state { text-align: center; padding: 3rem; color: #666; background: #fff; border-radius: 8px; border: 1px dashed #ccc; margin-top: 2rem; }
    .category-title { border-bottom: 2px solid #ccc; margin-top: 1.5rem; padding-bottom: 0.5rem; color: #333; }
    .grid-container { display: flex; flex-direction: column; gap: 0.5rem; }
    .grid-header, .grid-row { display: grid; grid-template-columns: 60px 1fr 2fr; gap: 1rem; padding: 0.75rem; border-radius: 4px; }
    .grid-header { font-weight: bold; background: #e9ecef; border-bottom: none; }
    .grid-row { background: #fff; border: 1px solid #ddd; cursor: pointer; transition: all 0.2s ease; }
    .grid-row:hover { background: #f8f9fa; border-color: #adb5bd; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .col-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #666; font-size: 0.9rem; }
    .mobile-label { display: none; font-weight: bold; color: #555; }
    @media (max-width: 600px) { .desktop-only { display: none; } .grid-row { grid-template-columns: 1fr; gap: 0.5rem; } .mobile-label { display: inline; } .col-text { -webkit-line-clamp: 3; } }
</style>