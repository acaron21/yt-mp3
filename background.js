chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "downloadMp3") {
      console.log("📤 Envoi de l'URL au serveur :", JSON.stringify({ url: message.url }));
  
      fetch("http://localhost:5000/api/dl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message.data) // 🔹 Vérifie que le JSON est bien formé
      })
      .then(response => response.json())
      .then(data =>{
        sendResponse(data);
        print("📥 Réponse du serveur :", data);
      })
      .catch(error => console.error("❌ Erreur de requête :", error));

      return true;
    }

    if(message.action === "getUSB"){
      console.log("Recupération du nom de la USB");

      fetch("http://localhost:5000/api/get_usb")
      .then(response => response.json())
      .then(data => {
        console.log("Données récupérées : ", data);
        sendResponse(data);
      })

      return true;
    }
  });
  