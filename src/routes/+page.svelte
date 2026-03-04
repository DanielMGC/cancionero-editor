<script lang="ts">
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import type { Song } from '$lib/types';
    import SongList from '$lib/components/SongList.svelte';
    import SongEditor from '$lib/components/SongEditor.svelte';
    
    // --- NEW: Firebase Imports ---
    import { db } from '$lib/firebase';
    import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

    let songs: Song[] = [];
    let view: 'list' | 'edit' = 'list';
    let currentTab: 'canciones' | 'oraciones' = 'canciones';
    
    let activeSong: Song | null = null;
    let isNewSong = false;
    let originalNumber: number | null = null;

    let searchQuery = '';
    let toastMessage = '';
    let toastTimeout: ReturnType<typeof setTimeout>;

    $: existingNumbers = songs.map(s => s.number);
    $: categories = [...new Set(songs.map(s => s.category))].filter(Boolean);

    onMount(() => {
        loadData(currentTab);
    });

    // --- UPDATED: Fetch from Firebase ---
    async function loadData(tab: string) {
        try {
            const querySnapshot = await getDocs(collection(db, tab));
            let loadedItems: Song[] = [];
            
            querySnapshot.forEach((doc) => {
                loadedItems.push(doc.data() as Song);
            });
            
            // Sort by number
            songs = loadedItems.sort((a, b) => a.number - b.number);
        } catch (error) {
            console.error("Error loading data from Firebase:", error);
            songs = [];
        }
    }

    function switchTab(tab: 'canciones' | 'oraciones') {
        if (currentTab === tab) return;
        
        if (view === 'edit') {
            const confirmLeave = confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cambiar de pestaña y perder estos cambios?');
            if (!confirmLeave) return;
        }
        
        currentTab = tab;
        view = 'list';
        searchQuery = '';
        loadData(currentTab);
    }

    function showToast(message: string) {
        toastMessage = message;
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastMessage = '';
        }, 3000);
    }

    function handleAdd() {
        const maxNum = songs.length > 0 ? Math.max(...songs.map(s => s.number)) : 0;
        activeSong = { number: maxNum + 1, category: '', title: '', author: '', text: '' };
        isNewSong = true;
        originalNumber = null;
        view = 'edit';
    }

    function handleEdit(song: Song) {
        activeSong = song;
        isNewSong = false;
        originalNumber = song.number;
        view = 'edit';
    }

    // --- UPDATED: Save to Firebase ---
    async function handleSave(savedSong: Song) {
        try {
            // Document ID is the song number (must be a string for Firebase)
            const docRef = doc(db, currentTab, savedSong.number.toString());
            
            // setDoc will create a new doc if it doesn't exist, or overwrite it if it does
            await setDoc(docRef, savedSong);

            // If the user changed the song's number, we need to delete the old document
            if (!isNewSong && originalNumber !== null && originalNumber !== savedSong.number) {
                await deleteDoc(doc(db, currentTab, originalNumber.toString()));
            }

            // Reload the list from the database
            await loadData(currentTab);
            view = 'list';
            
            const itemName = currentTab === 'canciones' ? 'Canción' : 'Oración';
            showToast(`¡${itemName} guardada exitosamente!`);
        } catch (error) {
            console.error("Error saving to Firebase:", error);
            alert("Hubo un error al guardar. Revisa la consola.");
        }
    }

    // --- UPDATED: Delete from Firebase ---
    async function handleDelete(songNumber: number) {
        const itemName = currentTab === 'canciones' ? 'esta canción' : 'esta oración';
        if (confirm(`¿Estás seguro que quieres eliminar ${itemName}?`)) {
            try {
                await deleteDoc(doc(db, currentTab, songNumber.toString()));
                await loadData(currentTab);
                view = 'list';
                showToast(`${currentTab === 'canciones' ? 'Canción eliminada' : 'Oración eliminada'}.`);
            } catch (error) {
                console.error("Error deleting from Firebase:", error);
                alert("Hubo un error al eliminar. Revisa la consola.");
            }
        }
    }

    function handleCancel() {
        view = 'list';
    }
</script>

<main>
    {#if view === 'list'}
        <SongList 
            {songs} 
            bind:searchQuery 
            {currentTab}
            onEdit={handleEdit} 
            onAdd={handleAdd} 
        >
            <div slot="tabs" class="tabs-container">
                <button class="tab-btn" class:active={currentTab === 'canciones'} on:click={() => switchTab('canciones')}>Canciones</button>
                <button class="tab-btn" class:active={currentTab === 'oraciones'} on:click={() => switchTab('oraciones')}>Oraciones</button>
            </div>
        </SongList>
    {:else if view === 'edit' && activeSong}
        <div class="tabs-container sticky-tabs">
            <button class="tab-btn" class:active={currentTab === 'canciones'} on:click={() => switchTab('canciones')}>Canciones</button>
            <button class="tab-btn" class:active={currentTab === 'oraciones'} on:click={() => switchTab('oraciones')}>Oraciones</button>
        </div>
        
        <SongEditor 
            song={activeSong} 
            isNew={isNewSong} 
            {originalNumber}
            {existingNumbers}
            {categories}
            {currentTab}
            onSave={handleSave} 
            onCancel={handleCancel} 
            onDelete={handleDelete} 
        />
    {/if}

    {#if toastMessage}
        <div class="toast" in:fly={{ y: 50, duration: 300 }} out:fade={{ duration: 300 }}>
            {toastMessage}
        </div>
    {/if}
</main>

<style>
    main {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem 1rem;
        font-family: system-ui, -apple-system, sans-serif;
        position: relative;
    }
    
    :global(body) {
        margin: 0;
        background-color: #f0f2f5;
    }
    :global(*), :global(*::before), :global(*::after) {
        box-sizing: border-box;
    }

    /* UPDATED: Tabs CSS to look good inside the sticky header */
    .tabs-container {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem; /* Space between tabs and header title */
        border-bottom: 2px solid #ddd;
    }
    
    /* NEW: Makes the tabs sticky when in the Editor view */
    .sticky-tabs {
        position: sticky;
        top: 0;
        background-color: #f0f2f5;
        z-index: 10;
        padding-top: 1rem;
        margin-top: -1rem;
    }

    .tab-btn {
        padding: 0.75rem 1.5rem;
        border: none;
        background: none;
        font-size: 1.1rem;
        font-weight: bold;
        color: #666;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px; 
        transition: all 0.2s;
    }
    .tab-btn:hover {
        color: #333;
    }
    .tab-btn.active {
        color: #4CAF50;
        border-bottom-color: #4CAF50;
    }

    .toast {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: #333;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
    }
</style>
