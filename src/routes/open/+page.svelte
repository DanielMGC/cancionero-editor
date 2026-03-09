<script lang="ts">
    import { onMount } from 'svelte';

    let status = 'Abriendo la aplicación...';

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const number = urlParams.get('initialNumber');
        const type = urlParams.get('type');
        
        // ⭐️ NEW: Catch the extra list context parameters
        const listaElements = urlParams.get('listaElements');
        const originalType = urlParams.get('originalType');

        if (!number || !type) {
            status = 'Enlace inválido.';
            return;
        }

        // ⭐️ NEW: Build the deep link dynamically with all available parameters
        let deepLink = `cancionero://canto?initialNumber=${number}&type=${type}`;
        if (listaElements) deepLink += `&listaElements=${listaElements}`;
        if (originalType) deepLink += `&originalType=${originalType}`;

        const appStoreLink = 'https://apps.apple.com/app/idYOUR_APPLE_ID'; 
        const playStoreLink = 'https://play.google.com/store/apps/details?id=ar.gclua.cancionerov2';

        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);

        window.location.replace(deepLink);

        setTimeout(() => {
            status = 'Redirigiendo a la tienda de aplicaciones...';
            if (isIOS) {
                //window.location.replace(appStoreLink);
                status = 'Lamentablemente la app no está disponible para dispositivos iOS.';
            } else if (isAndroid) {
                window.location.replace(playStoreLink);
            } else {
                status = 'Por favor, abre este enlace desde tu celular para descargar la app.';
            }
        }, 2500);
    });
</script>

<svelte:head>
    <title>Abriendo Cancionero...</title>
</svelte:head>

<main class="container">
    <div class="card">
        <h1>📖 Cancionero</h1>
        <p>{status}</p>
        <div class="spinner"></div>
    </div>
</main>

<style>
    .container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        background-color: #f0f2f5;
        font-family: system-ui, sans-serif;
    }
    .card {
        background: white;
        padding: 2rem 3rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
    }
    h1 { color: #6f4a27; margin-bottom: 1rem; }
    p { color: #666; font-size: 1.1rem; margin-bottom: 2rem; }
    
    .spinner {
        width: 40px;
        height: 40px;
        margin: 0 auto;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #6f4a27;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>