

// Fonction pour vérifier si on est sur une page vidéo
function isVideoPage() {
    return window.location.href.includes("watch?v=");
}

// Fonction pour créer la pop-up
function createFloatingPopup() {
    if (!isVideoPage()) {
        console.log("❌ Pas une page vidéo, la pop-up ne sera pas affichée.");
        return;
            }

    fetch(chrome.runtime.getURL("popup.html"))
    .then(response => response.text())
    .then(html =>{
        
        if (document.getElementById("mp3-downloader-popup")) return;
        
        // creer div pour inserer popup
        let popupDiv = document.createElement("div");
        popupDiv.id = "mp3-downloader-popup";
        popupDiv.innerHTML = html;
        document.body.appendChild(popupDiv);

        //Ajouter mon style
        let style = document.createElement("link");
        style.rel = "stylesheet";
        style.href = chrome.runtime.getURL("style.css");
        document.head.appendChild(style);

        // Charger Bootstrap CSS
        let bootstrapCSS = document.createElement("link");
        bootstrapCSS.rel = "stylesheet";
        bootstrapCSS.href = chrome.runtime.getURL("bootstrap/bootstrap.min.css");
        document.head.appendChild(bootstrapCSS);

        // Charger Bootstrap JS (optionnel)
        let bootstrapJS = document.createElement("script");
        bootstrapJS.src = chrome.runtime.getURL("bootstrap/bootstrap.bundle.min.js");
        document.body.appendChild(bootstrapJS);

        // // ajouter logo usb
        // let imgElement = document.querySelector("img.img-fluid");
        // if (imgElement) {
        //     imgElement.src = chrome.runtime.getURL("usb_icon.png");
        //     console.log("✅ Image USB chargée :", imgElement.src);
        // } else {
        //     console.log("❌ L'image USB n'a pas été trouvée !");
        // }


        // ajouter un event à mon bouton
        document.getElementById('download-btn').addEventListener("click", () => {
            confirmDownload();
            console.log("test1");
            // const videoUrl = window.location.href; // lien de la page
            // console.log("🎵 Bouton cliqué, envoi de l'URL :", videoUrl);
            // chrome.runtime.sendMessage({ action: "downloadMp3", url: videoUrl }); // envoyer un message à mon background.js qui écoute les messages
        });


        //change the USB div
        chrome.runtime.sendMessage({action:"getUSB", data: {} }, response => {
            console.log("We got a response : ", response);
            // document.getElementById('usb-name').innerText = response.usb_name;
            updateUSB(response.usb_name);

            // changer nombre de musique
            document.getElementById('nb-musiques').innerText = response.last_music;

        })
        

        console.log("Bootstrap ajouté  caca!")

    }).catch(error => console.log("Erreur lors du chargement du popup : ", error));
}

//handle USB display
function updateUSB(usb_name){
    let imgElement = document.getElementById('img-usb-logo');
    if (usb_name === 'None'){

        imgElement.src = chrome.runtime.getURL("icon_no_usb.png");
        document.getElementById('download-btn').disabled = true;
        console.log('PAS DE CLE USB ', usb_name);
    }
    else{
        document.getElementById('download-btn').disabled = false;
        imgElement.src = chrome.runtime.getURL("usb_icon.png");

        // change color
        let color = ""
        console.log("name usb : ", usb_name);
        switch (usb_name){
            case "NOIR" : 
                color="000000";
                break;
            case "VIOLET" : 
                color="b11cd3";
                break;
            case "VERT" : 
                color="2bde1f";
                break;
            case "BLEU" : 
                color="3a51e4";
                break;
            case "ROUGE" : 
                color="e90e0e";
                break;

            default :
                 color="212529";
        }

        console.log("color : ", color);

        document.getElementById('div-img-usb').style.cssText += `background-color: #${color} !important;`;

    }
}   

//fonction pour créer le changement de titre
function confirmDownload(){
    console.log("test2");
    fetch(chrome.runtime.getURL('confirm.html'))
    .then(response => response.text())
    .then(html =>{

        //add container
        let confirmDiv = document.createElement("div");
        confirmDiv.id = "confirm-div";
        confirmDiv.innerHTML = html;
        document.body.appendChild(confirmDiv);

        //QUITTER AVEC LE BOUTON ANNULER
        confirmationCancel = document.getElementById('confirm-cancel');
        confirmationCancel.addEventListener("click", () => {
            closeConfirmModal();
        });

        // RECUP LE TITRE DE LA VIDEOq
        let title = "";
        let titleElement = document.querySelector("#title h1 yt-formatted-string");
        if (titleElement){
            title = titleElement.textContent;
            console.log("Titre : ", title);
        }
        else{
            title = "Titre pas trouvé, re-tente ta chance !";
        }


        //AJOUTER TITRE AU CHAMP TEXTE
        setTimeout(() =>{
            let titleInput = document.getElementById("cst-title");
            if(titleInput){
                titleInput.value=title;
                console.log("Bien mis");
            }
            else {
                console.log("❌ L'élément #title est introuvable !");
            }
            }, 100)


        // EVENT BOUTON TELECHARGER
        document.getElementById('confirm-dl').addEventListener("click", () => {
            const videoUrl = window.location.href; // lien de la page
            const title = document.getElementById('cst-title').value;

            // data à envoyer
            let video = {
                url: videoUrl,
                title:title
            };

            console.log("🎵 Bouton cliqué, envoi de l'URL :", videoUrl);
            console.log("🎵 Titre :", title);
            
            // close confirm modal
            closeConfirmModal();

            //open loading modal
            options = {
                    "message":"Téléchargement en cours...",
                    "display_button": false,
                    "bs_background" : "bg-warning"
                };
            createInfoModal(options);
            

            // send instruction to server
            chrome.runtime.sendMessage({ action: "downloadMp3", data:video}, response => {
                
                console.log("Reponse serveur : ", response);
                closeInfoModal();

                if (response.success){
                    options = {
                        "message":"Téléchargement terminé !",
                        "display_button": true,
                        "bs_background" : "bg-success"
                    };
                    createInfoModal(options);

                    document.getElementById('nb-musiques').innerText = response.nb_musique;
                }
                else{
                    options = {
                        "message":response.error,
                        "display_button": true,
                        "bs_background" : "bg-danger"
                    };
                    createInfoModal(options);
                }

                
            }); 
    
        });
    });
}

function closeConfirmModal(){
    confirmModal = document.getElementById('confirmation-bg');
    if(confirmModal){confirmModal.remove();}
}

function createInfoModal(options){
    fetch(chrome.runtime.getURL('modal.html'))
    .then(response => response.text())
    .then(html => {
        //add container
        let modalDiv = document.createElement("div");
        modalDiv.id = "modal-div";
        modalDiv.innerHTML = html;
        document.body.appendChild(modalDiv);

        // change message content
        document.getElementById('main-message').textContent = options.message;

        //change background color
        document.getElementById('modal-info').classList.add(options.bs_background);

        //put event to close btn
        btnClose = document.getElementById('btn-close');

        btnClose.addEventListener("click", ()=> {
            document.getElementById('modal-info-container').remove();
        });

        //check if btn is displayed
        if (options.display_button === true){
            btnClose.classList.add('d-block');
            btnClose.classList.remove('d-none');
        }
        else{
            btnClose.classList.add('d-none');
            btnClose.classList.remove('d-block');
        }

    });
}



function closeInfoModal(){
    infoModal = document.getElementById('modal-info-container');
    if(infoModal){infoModal.remove();}
}



// 
//      OBSERVER POUR LANCER LE POPUP
//
//

// Supprime le pop-up si on n'est plus sur une vidéo
function removeFloatingPopup() {
    let popup = document.getElementById("mp3-downloader-popup");
    if (popup) popup.remove();
}

// Gère l'affichage du pop-up en fonction de la page
function checkForVideoChange() {
    if (isVideoPage()) {
        createFloatingPopup();
    } else {
        removeFloatingPopup();
    }
}

// Observer les changements de page sur YouTube
const observer = new MutationObserver(checkForVideoChange);
observer.observe(document.body, { childList: true, subtree: true });

// Écouter les événements de navigation YouTube
window.addEventListener("yt-navigate-finish", checkForVideoChange);
window.addEventListener("yt-page-data-updated", checkForVideoChange);

// Vérifier immédiatement à l'injection du script
checkForVideoChange();