<script lang="ts">
    import { onMount } from 'svelte';
    import { fly, fade } from 'svelte/transition';
    import type { Song, Lista } from '$lib/types';
    import SongList from '$lib/components/SongList.svelte';
    import SongEditor from '$lib/components/SongEditor.svelte';
    import ListEditor from '$lib/components/ListEditor.svelte'; // ⭐️ Import new editor
    
    import { db } from '$lib/firebase';
    import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

    let canciones: Song[] = [];
    let oraciones: Song[] = [];
    let listas: Lista[] = [];
    
    let view: 'list' | 'edit' = 'list';
    let currentTab: 'canciones' | 'oraciones' | 'listas' = 'canciones';
    
    let activeItem: any = null;
    let isNewItem = false;
    let originalNumber: number | null = null;

    let searchQuery = '';
    let toastMessage = '';
    let toastTimeout: ReturnType<typeof setTimeout>;

    // Dynamically point to the active array for validation and mapping
    $: activeArray = currentTab === 'canciones' ? canciones : currentTab === 'oraciones' ? oraciones : listas;
    $: existingNumbers = activeArray.map(s => s.number);
    // Explicitly cast activeArray to Song[] when generating categories
    $: categories = currentTab === 'listas' 
        ? [] 
        : [...new Set((activeArray as Song[]).map(s => s.category))].filter(Boolean);

    onMount(() => {
        loadAllData();
    });

    async function loadAllData() {
        try {
            const [cSnap, oSnap, lSnap] = await Promise.all([
                getDocs(collection(db, 'canciones')),
                getDocs(collection(db, 'oraciones')),
                getDocs(collection(db, 'listas'))
            ]);
            
            canciones = cSnap.docs.map(doc => doc.data() as Song).sort((a, b) => a.number - b.number);
            oraciones = oSnap.docs.map(doc => doc.data() as Song).sort((a, b) => a.number - b.number);
            listas = lSnap.docs.map(doc => doc.data() as Lista).sort((a, b) => a.number - b.number);
        } catch (error) {
            console.error("Error loading data from Firebase:", error);
        }
    }

    function switchTab(tab: 'canciones' | 'oraciones' | 'listas') {
        if (currentTab === tab) return;
        if (view === 'edit') {
            const confirmLeave = confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cambiar de pestaña y perder estos cambios?');
            if (!confirmLeave) return;
        }
        currentTab = tab;
        view = 'list';
        searchQuery = '';
    }

    function showToast(message: string) {
        toastMessage = message;
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => { toastMessage = ''; }, 3000);
    }

    function handleAdd() {
        const maxNum = activeArray.length > 0 ? Math.max(...activeArray.map(s => s.number)) : 0;
        if (currentTab === 'listas') {
            activeItem = { number: maxNum + 1, title: '', elements: [] };
        } else {
            activeItem = { number: maxNum + 1, category: '', title: '', author: '', text: '' };
        }
        isNewItem = true;
        originalNumber = null;
        view = 'edit';
    }

    function handleEdit(item: any) {
        activeItem = { ...item };
        isNewItem = false;
        originalNumber = item.number;
        view = 'edit';
    }

    async function handleSave(savedItem: any) {
        try {
            const docRef = doc(db, currentTab, savedItem.number.toString());
            await setDoc(docRef, savedItem);

            if (!isNewItem && originalNumber !== null && originalNumber !== savedItem.number) {
                await deleteDoc(doc(db, currentTab, originalNumber.toString()));
            }

            await loadAllData(); // Refresh everything
            view = 'list';
            
            const itemName = currentTab === 'canciones' ? 'Canción' : currentTab === 'oraciones' ? 'Oración' : 'Lista';
            showToast(`¡${itemName} guardada exitosamente!`);
        } catch (error) {
            console.error("Error saving to Firebase:", error);
            alert("Hubo un error al guardar. Revisa la consola.");
        }
    }

    async function handleDelete(itemNumber: number) {
        const itemName = currentTab === 'canciones' ? 'esta canción' : currentTab === 'oraciones' ? 'esta oración' : 'esta lista';
        if (confirm(`¿Estás seguro que quieres eliminar ${itemName}?`)) {
            try {
                await deleteDoc(doc(db, currentTab, itemNumber.toString()));
                await loadAllData();
                view = 'list';
                showToast(`Eliminada exitosamente.`);
            } catch (error) {
                console.error("Error deleting from Firebase:", error);
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
            items={activeArray}
            {canciones}
            {oraciones}
            bind:searchQuery 
            {currentTab}
            onEdit={handleEdit} 
            onAdd={handleAdd} 
        >
            <div slot="tabs" class="tabs-container">
                <button class="tab-btn" class:active={currentTab === 'canciones'} on:click={() => switchTab('canciones')}>Canciones</button>
                <button class="tab-btn" class:active={currentTab === 'oraciones'} on:click={() => switchTab('oraciones')}>Oraciones</button>
                <button class="tab-btn" class:active={currentTab === 'listas'} on:click={() => switchTab('listas')}>Listas</button>
            </div>
        </SongList>
    {:else if view === 'edit' && activeItem}
        <div class="tabs-container sticky-tabs">
            <button class="tab-btn" class:active={currentTab === 'canciones'} on:click={() => switchTab('canciones')}>Canciones</button>
            <button class="tab-btn" class:active={currentTab === 'oraciones'} on:click={() => switchTab('oraciones')}>Oraciones</button>
            <button class="tab-btn" class:active={currentTab === 'listas'} on:click={() => switchTab('listas')}>Listas</button>
        </div>
        
        {#if currentTab === 'listas'}
            <ListEditor 
                lista={activeItem} 
                isNew={isNewItem} 
                {originalNumber}
                {existingNumbers}
                {canciones}
                {oraciones}
                onSave={handleSave} 
                onCancel={handleCancel} 
                onDelete={handleDelete} 
            />
        {:else}
            <SongEditor 
                song={activeItem} 
                isNew={isNewItem} 
                {originalNumber}
                {existingNumbers}
                {categories}
                {currentTab}
                onSave={handleSave} 
                onCancel={handleCancel} 
                onDelete={handleDelete} 
            />
        {/if}
    {/if}

    {#if toastMessage}
        <div class="toast" in:fly={{ y: 50, duration: 300 }} out:fade={{ duration: 300 }}>
            {toastMessage}
        </div>
    {/if}
</main>

<style>
    main { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; font-family: system-ui, -apple-system, sans-serif; position: relative; }
    :global(body) { margin: 0; background-color: #f0f2f5; }
    :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }

    .tabs-container { display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid #ddd; }
    .sticky-tabs { position: sticky; top: 0; background-color: #f0f2f5; z-index: 10; padding-top: 1rem; margin-top: -1rem; }
    .tab-btn { padding: 0.75rem 1.5rem; border: none; background: none; font-size: 1.1rem; font-weight: bold; color: #666; cursor: pointer; border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
    .tab-btn:hover { color: #333; }
    .tab-btn.active { color: #4CAF50; border-bottom-color: #4CAF50; }

    .toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); background-color: #333; color: white; padding: 1rem 2rem; border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; }
</style>