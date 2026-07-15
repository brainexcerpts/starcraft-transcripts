
    const managedDialogueAudio = {
        audios: [],
        currentAudio: null,
        pendingPlayAudio: null,
        observer: null,
        loadingAudios: new Set(),
        boundAudios: new WeakSet(),
        maxConcurrentLoads: 2,
        initialized: false,
        globalListenersBound: false,
    };

    function isManagedDialogueAudio(audio) {
        return audio != null && audio.getAttribute('data-audio-managed') === 'dialogue';
    }

    function getManagedDialogueAudioControl(audio) {
        if(audio == null)
            return null;

        let sibling = audio.nextElementSibling;
        if(sibling != null && sibling.classList.contains('dialogue-audio-controls'))
            return sibling;

        return audio.parentElement.querySelector('.dialogue-audio-controls');
    }

    function getManagedDialogueAudioFromControl(controlElt) {
        if(controlElt == null)
            return null;

        let sibling = controlElt.previousElementSibling;
        while(sibling != null) {
            if(sibling.tagName === 'AUDIO')
                return sibling;
            sibling = sibling.previousElementSibling;
        }

        return controlElt.parentElement.querySelector('audio');
    }

    function setManagedDialogueAudioUiState(audio, state, message = '') {
        let control = getManagedDialogueAudioControl(audio);
        if(control == null)
            return;

        control.setAttribute('data-audio-state', state);

        let playButton = control.getElementsByClassName('playbutton')[0];
        let pauseButton = control.getElementsByClassName('pausebutton')[0];
        let resetButton = control.getElementsByClassName('resetbutton')[0];
        let status = control.getElementsByClassName('audio-load-status')[0];

        if(playButton == null || pauseButton == null || resetButton == null || status == null)
            return;

        if(state === 'loading') {
            playButton.style.display = 'none';
            pauseButton.style.display = 'none';
            resetButton.style.display = '';
            status.textContent = message !== '' ? message : 'Loading...';
            status.setAttribute('aria-hidden', 'false');
            return;
        }

        if(state === 'playing') {
            playButton.style.display = 'none';
            pauseButton.style.display = '';
            resetButton.style.display = '';
            status.textContent = '';
            status.setAttribute('aria-hidden', 'true');
            return;
        }

        if(state === 'paused') {
            playButton.style.display = '';
            pauseButton.style.display = 'none';
            resetButton.style.display = '';
            status.textContent = '';
            status.setAttribute('aria-hidden', 'true');
            return;
        }

        if(state === 'error') {
            playButton.style.display = '';
            pauseButton.style.display = 'none';
            resetButton.style.display = 'none';
            status.textContent = message !== '' ? message : 'Audio unavailable';
            status.setAttribute('aria-hidden', 'false');
            return;
        }

        playButton.style.display = '';
        pauseButton.style.display = 'none';
        resetButton.style.display = 'none';
        status.textContent = '';
        status.setAttribute('aria-hidden', 'true');
    }

    function clearManagedDialogueAudioLoadState(audio) {
        if(audio == null)
            return;

        managedDialogueAudio.loadingAudios.delete(audio);
        audio.dataset.audioLoadState = 'idle';
        audio.preload = 'none';
    }

    function getManagedDialogueAudioAnchor(audio) {
        let control = getManagedDialogueAudioControl(audio);
        if(control != null)
            return control;

        return audio.closest('.transcriptBox') || audio;
    }

    function getManagedDialogueAudioDistanceToViewport(audio) {
        let anchor = getManagedDialogueAudioAnchor(audio);
        let rect = anchor.getBoundingClientRect();
        let viewportHeight = window.innerHeight || document.documentElement.clientHeight;

        if(rect.bottom >= 0 && rect.top <= viewportHeight)
            return 0;

        if(rect.top > viewportHeight)
            return rect.top - viewportHeight;

        return Math.abs(rect.bottom);
    }

    function loadManagedDialogueAudio(audio, forceImmediate = false) {
        if(audio == null)
            return false;

        if(audio.dataset.audioLoadState === 'ready')
            return false;

        if(managedDialogueAudio.loadingAudios.has(audio))
            return false;

        if(!forceImmediate && managedDialogueAudio.loadingAudios.size >= managedDialogueAudio.maxConcurrentLoads)
            return false;

        audio.dataset.audioLoadState = 'loading';
        audio.preload = 'auto';
        managedDialogueAudio.loadingAudios.add(audio);

        if(audio === managedDialogueAudio.pendingPlayAudio)
            setManagedDialogueAudioUiState(audio, 'loading', 'Loading...');

        audio.load();
        return true;
    }

    function scheduleManagedDialogueAudioLoads() {
        if(managedDialogueAudio.audios.length === 0)
            return;

        let viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        let preloadRange = viewportHeight * 1.5;
        let queue = [];
        let seen = new Set();

        let pushAudio = function(audio) {
            if(audio == null || seen.has(audio))
                return;
            seen.add(audio);
            queue.push(audio);
        };

        pushAudio(managedDialogueAudio.pendingPlayAudio);
        pushAudio(managedDialogueAudio.currentAudio);

        let nearbyAudio = managedDialogueAudio.audios
            .map(audio => ({
                audio: audio,
                distance: getManagedDialogueAudioDistanceToViewport(audio),
            }))
            .filter(item => item.distance <= preloadRange)
            .sort((left, right) => left.distance - right.distance);

        for(let item of nearbyAudio)
            pushAudio(item.audio);

        for(let audio of queue) {
            if(managedDialogueAudio.loadingAudios.size >= managedDialogueAudio.maxConcurrentLoads)
                break;

            loadManagedDialogueAudio(audio);
        }
    }

    function handleManagedDialogueAudioReady(audio) {
        managedDialogueAudio.loadingAudios.delete(audio);
        audio.dataset.audioLoadState = 'ready';

        if(audio === managedDialogueAudio.pendingPlayAudio) {
            playManagedDialogueAudio(audio);
        } else if(!audio.paused && !audio.ended) {
            setManagedDialogueAudioUiState(audio, 'playing');
        } else if(audio.currentTime > 0) {
            setManagedDialogueAudioUiState(audio, 'paused');
        } else {
            setManagedDialogueAudioUiState(audio, 'idle');
        }

        scheduleManagedDialogueAudioLoads();
    }

    function handleManagedDialogueAudioError(audio) {
        managedDialogueAudio.loadingAudios.delete(audio);
        audio.dataset.audioLoadState = 'error';

        if(managedDialogueAudio.pendingPlayAudio === audio)
            managedDialogueAudio.pendingPlayAudio = null;

        setManagedDialogueAudioUiState(audio, 'error', 'Audio unavailable');
        scheduleManagedDialogueAudioLoads();
    }

    function bindManagedDialogueAudioEvents(audio) {
        if(managedDialogueAudio.boundAudios.has(audio))
            return;

        managedDialogueAudio.boundAudios.add(audio);

        audio.addEventListener('loadstart', function() {
            if(audio === managedDialogueAudio.pendingPlayAudio)
                setManagedDialogueAudioUiState(audio, 'loading', 'Loading...');
        });

        audio.addEventListener('canplay', function() {
            handleManagedDialogueAudioReady(audio);
        });

        audio.addEventListener('playing', function() {
            managedDialogueAudio.currentAudio = audio;
            if(managedDialogueAudio.pendingPlayAudio === audio)
                managedDialogueAudio.pendingPlayAudio = null;
            setManagedDialogueAudioUiState(audio, 'playing');
        });

        audio.addEventListener('pause', function() {
            if(managedDialogueAudio.currentAudio === audio)
                managedDialogueAudio.currentAudio = null;

            if(audio.currentTime === 0 || audio.ended) {
                setManagedDialogueAudioUiState(audio, 'idle');
            } else if(audio !== managedDialogueAudio.pendingPlayAudio) {
                setManagedDialogueAudioUiState(audio, 'paused');
            }
        });

        audio.addEventListener('ended', function() {
            if(managedDialogueAudio.currentAudio === audio)
                managedDialogueAudio.currentAudio = null;
            audio.currentTime = 0;
            setManagedDialogueAudioUiState(audio, 'idle');
        });

        audio.addEventListener('waiting', function() {
            if(audio === managedDialogueAudio.currentAudio || audio === managedDialogueAudio.pendingPlayAudio)
                setManagedDialogueAudioUiState(audio, 'loading', 'Buffering...');
        });

        audio.addEventListener('stalled', function() {
            if(audio === managedDialogueAudio.currentAudio || audio === managedDialogueAudio.pendingPlayAudio)
                setManagedDialogueAudioUiState(audio, 'loading', 'Buffering...');
        });

        audio.addEventListener('error', function() {
            handleManagedDialogueAudioError(audio);
        });
    }

    function prepareManagedDialogueAudio(audio) {
        if(!isManagedDialogueAudio(audio))
            return;

        bindManagedDialogueAudioEvents(audio);

        clearManagedDialogueAudioLoadState(audio);
        delete audio.dataset.audioNearViewport;
        delete audio.dataset.audioListenersBound;

        setManagedDialogueAudioUiState(audio, 'idle');
    }

    function initManagedDialogueAudioObserver() {
        if(!('IntersectionObserver' in window))
            return;

        managedDialogueAudio.observer = new IntersectionObserver(function(entries) {
            for(let entry of entries) {
                let audio = entry.target.__managedDialogueAudio;
                if(audio == null)
                    continue;

                audio.dataset.audioNearViewport = entry.isIntersecting ? 'true' : 'false';
            }

            scheduleManagedDialogueAudioLoads();
        }, {
            root: null,
            rootMargin: '250px 0px 250px 0px',
            threshold: 0,
        });

        for(let audio of managedDialogueAudio.audios) {
            let anchor = getManagedDialogueAudioAnchor(audio);
            anchor.__managedDialogueAudio = audio;
            managedDialogueAudio.observer.observe(anchor);
        }
    }

    function initManagedDialogueAudio() {
        managedDialogueAudio.audios = Array.from(document.querySelectorAll('audio[data-audio-managed="dialogue"]'));
        managedDialogueAudio.currentAudio = null;
        managedDialogueAudio.pendingPlayAudio = null;
        managedDialogueAudio.loadingAudios = new Set();
        managedDialogueAudio.initialized = true;

        if(managedDialogueAudio.observer != null) {
            managedDialogueAudio.observer.disconnect();
            managedDialogueAudio.observer = null;
        }

        for(let audio of managedDialogueAudio.audios)
            prepareManagedDialogueAudio(audio);

        initManagedDialogueAudioObserver();

        if(!managedDialogueAudio.globalListenersBound) {
            window.addEventListener('scroll', scheduleManagedDialogueAudioLoads, { passive: true });
            window.addEventListener('resize', scheduleManagedDialogueAudioLoads);
            managedDialogueAudio.globalListenersBound = true;
        }

        scheduleManagedDialogueAudioLoads();
    }

    document.addEventListener('DOMContentLoaded', function() {
        if(document.querySelector('audio[data-audio-managed="dialogue"]') != null)
            initManagedDialogueAudio();
    });

    function stopManagedDialogueAudio(audio) {
        if(audio == null)
            return;

        if(managedDialogueAudio.pendingPlayAudio === audio)
            managedDialogueAudio.pendingPlayAudio = null;

        if(managedDialogueAudio.currentAudio === audio)
            managedDialogueAudio.currentAudio = null;

        audio.pause();
        audio.currentTime = 0;
        setManagedDialogueAudioUiState(audio, 'idle');
    }

    function stopOtherManagedDialogueAudio(targetAudio) {
        for(let audio of managedDialogueAudio.audios) {
            if(audio === targetAudio)
                continue;

            stopManagedDialogueAudio(audio);
        }
    }

    function playManagedDialogueAudio(audio) {
        let playPromise;
        try {
            playPromise = audio.play();
        } catch (error) {
            handleManagedDialogueAudioError(audio);
            return;
        }

        if(playPromise != null && typeof playPromise.catch === 'function') {
            playPromise.catch(function() {
                if(managedDialogueAudio.pendingPlayAudio === audio)
                    handleManagedDialogueAudioError(audio);
            });
        }
    }

    function requestManagedDialoguePlayback(audio) {
        if(audio == null)
            return;

        stopOtherManagedDialogueAudio(audio);
        managedDialogueAudio.pendingPlayAudio = audio;
        setManagedDialogueAudioUiState(audio, 'loading', 'Loading...');

        if(audio.dataset.audioLoadState === 'ready' || audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            playManagedDialogueAudio(audio);
            return;
        }

        loadManagedDialogueAudio(audio, true);
        scheduleManagedDialogueAudioLoads();
    }

    function handleManagedDialogueAudioSourceChanged(audio) {
        if(audio == null)
            return;

        stopManagedDialogueAudio(audio);
        clearManagedDialogueAudioLoadState(audio);

        if(managedDialogueAudio.initialized)
            scheduleManagedDialogueAudioLoads();
    }

    /* ***********************************
        Show Hide the desired translation
        japanese, english or french
    ************************************** */
        function getBoxElement(divElt) {
            return divElt.closest('.transcriptBox');
        }

        function displayNoneAll(elt) {
            let boxElt = getBoxElement(elt);
            let divText = getAllTextElements(boxElt);
            for (let i = 0; i < divText.length; i++) {
                divText[i].style.display = 'none';
            }

            // remove highlight from all icons:
            let imgElements = boxElt.querySelectorAll('img');
            for (let i = 0; i < imgElements.length; i++) {
                imgElements[i].classList.remove('flag-highlighted');
            }
        }

        function getAllTextElements(boxElement) {
            // get all divs with class 'english' or 'japanese' or 'french'
            let divTextArray = boxElement.querySelectorAll('div.english, div.japanese, div.french');

            if (divTextArray.length == 0) {
                console.log("error");
                return null;
            }

            return divTextArray;
        }

        function getTextElementsOfType(boxElement, field) {
            let divText = getAllTextElements(boxElement);
            let divTextArray = [];
            for (let i = 0; i < divText.length; i++) {
                if (divText[i].className == field)
                    divTextArray.push(divText[i]);
            }
            return divTextArray;
        }

        /*
            Hides every text fields except for 'fieldToEnable'
        */
        function toggleTextVisibility(elt, fieldToEnable) {
            displayNoneAll(elt);
            let boxElt = getBoxElement(elt);
            let rawTextElts = getTextElementsOfType(boxElt, fieldToEnable);
            if(rawTextElts.length > 0)
            {
                highlightIcon(elt, fieldToEnable);

                for( rawText of rawTextElts)
                    rawText.style.display = 'block';
            } else
                console.log("warning: no such field: " + fieldToEnable);

            if(fieldToEnable == 'english'){
                setAudioSourceTo(elt, src => src.replace(/^(.*)\/audio\/(.*)$/, "$1/audio/en/$2") );
            } else  {
                setAudioSourceTo(elt, src => src.replace(/^(.*)\/audio\/en\/(.*)$/, "$1/audio/$2") );
            }
        }

        function setAudioSourceTo(elt, replace) {
            let boxElt = getBoxElement(elt);
            //let audios = boxElt.querySelectorAll('audio');
            let audios = boxElt.getElementsByTagName('audio');
            for(let audio of audios)
            {
                if( audio === null || audio === undefined){
                    console.alert("error: audio is null for element: " + elt);
                    continue;
                }
                // get source src of audio:
                let sourceTag = audio.querySelector('source');

                if( sourceTag === null || sourceTag === undefined){
                    console.alert("error: sourceTag is null for element: " + elt);
                    continue;
                }

                let src = sourceTag.getAttribute('src');
                //console.log("src: " + src);
                // replace some/path/audio/file.ext by some/path/audio/en/file.ext if the file exists:
                let newSrc = replace(src);
                // check if file exists:
                /*
                fetch(newSrc).then( (response) => {
                    if(response.status == 200){
                        // replace src of audio tag:
                        sourceTag.setAttribute('src', newSrc);
                        audio.load();
                    }
                });
                */
               // fetch won't work for local files, alternative:
               if( newSrc != src){
                    sourceTag.setAttribute('src', newSrc);

                    if(isManagedDialogueAudio(audio)) {
                        handleManagedDialogueAudioSourceChanged(audio);
                    } else {
                        audio.load();
                    }
               }
            }
        }

        function highlightIcon(elt, language, highlight = true){
            let imgElements = elt.querySelectorAll('img.' + getImgClass(language));
            for (let i = 0; i < imgElements.length; i++) {
                if(highlight)
                    imgElements[i].classList.add('flag-highlighted');
                else
                    imgElements[i].classList.remove('flag-highlighted');
            }
        }

        function getImgClass(languageName){
            if(languageName == 'english')
                return 'icon_en';
            else if(languageName == 'japanese')
                return 'icon_jp';
            else if(languageName == 'french')
                return 'icon_fr';
            else
                console.log("error: unknown language: " + languageName);

            return null;
        }

        function toggleJapanese(elt) { stopAudio(elt); toggleTextVisibility(elt, 'japanese'); }
        function toggleEnglish(elt) { stopAudio(elt); toggleTextVisibility(elt, 'english'); }
        function toggleFrench(elt) { stopAudio(elt); toggleTextVisibility(elt, 'french'); }

        function stopAudio(elt) {
            let boxElt = getBoxElement(elt);
            let audios = boxElt.querySelectorAll('audio');
            for(let audio of audios)
            {
                if( audio === null || audio === undefined)
                    continue;
                if(isManagedDialogueAudio(audio)) {
                    stopManagedDialogueAudio(audio);
                } else {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        }

        /* ***********************************
            Handling play pause stop buttons
            of the audio player
        ************************************** */
        function play_nearest_audio(elt) {
            let audioTag = getManagedDialogueAudioFromControl(elt);
            requestManagedDialoguePlayback(audioTag);
        }

        function pausieren(elt) {
            let audioTag = getManagedDialogueAudioFromControl(elt);
            if(audioTag == null)
                return;

            if(managedDialogueAudio.pendingPlayAudio === audioTag)
                managedDialogueAudio.pendingPlayAudio = null;

            audioTag.pause();
            setManagedDialogueAudioUiState(audioTag, audioTag.currentTime > 0 ? 'paused' : 'idle');
        }
        function resetTime(elt) {
            let audioTag = getManagedDialogueAudioFromControl(elt);
            stopManagedDialogueAudio(audioTag);
        }

        // ---------------------------------------------

        // when page finished loading, erase the donation button:
        window.onload = function() {
            let donateButton = document.querySelector('a[href*="paypal"]');
            if(donateButton != null)
                donateButton.style.display = 'none';
        }