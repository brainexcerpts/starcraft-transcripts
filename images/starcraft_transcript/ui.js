
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
            let audios = boxElt.querySelectorAll('audio');
            for(let audio of audios)
            {
                if( audio === null || audio === undefined)
                    continue;
                // get source src of audio:
                let sourceTag = audio.querySelector('source');

                if( sourceTag === null || sourceTag === undefined)
                    continue;

                let src = sourceTag.getAttribute('src');
                //console.log("src: " + src);
                // replace some/path/audio/file.ext by some/path/audio/en/file.ext if the file exists:
                let newSrc = replace(src);
                // check if file exists:
                fetch(newSrc).then( (response) => {
                    if(response.status == 200){
                        // replace src of audio tag:
                        sourceTag.setAttribute('src', newSrc);
                        audio.load();
                    }
                });
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
                audio.pause();
                audio.currentTime = 0;
            }

            let playButton = boxElt.getElementsByClassName("playbutton");
            if(playButton.length > 0){
                playButton[0].style.display = "";
            }

            let pauseButton = boxElt.getElementsByClassName("pausebutton")

            if(pauseButton.length > 0){
                pauseButton[0].style.display = "none";
            }

            let resetbutton = boxElt.getElementsByClassName("resetbutton")
            if(resetbutton.length > 0){
                resetbutton[0].style.display = "none";
            }
        }

        /* ***********************************
            Handling play pause stop buttons
            of the audio player
        ************************************** */
        function play_nearest_audio(elt) {
            let parent = elt.parentElement;
            // get the audio tag:
            let audioTag = parent.querySelector('audio');
            audioTag.play();

            parent.getElementsByClassName("pausebutton")[0].style.display = "";
            parent.getElementsByClassName("playbutton")[0].style.display = "none";
            parent.getElementsByClassName("resetbutton")[0].style.display = "";

            // add event that will call resetTime when audio ends:
            audioTag.addEventListener("ended", function () {
                resetTime(elt);
            });
        }

        function pausieren(elt) {
            let parent = elt.parentElement;
            parent.querySelector('audio').pause();
            parent.getElementsByClassName("playbutton")[0].style.display = "";
            parent.getElementsByClassName("pausebutton")[0].style.display = "none";
        }
        function resetTime(elt) {
            pausieren(elt);

            let parent = elt.parentElement;
            parent.querySelector('audio').currentTime = 0;
            parent.getElementsByClassName("resetbutton")[0].style.display = "none";
        }

        // ---------------------------------------------