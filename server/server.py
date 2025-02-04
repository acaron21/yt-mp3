from flask import Flask, request, jsonify
import psutil
import win32api
import os
import subprocess

app = Flask(__name__)

USB = {
    "usb_name" : "",
    "usb_path" : ""
}

musiques = {
    "last_musique": 0
}

def get_usb_drives():
    usb_drives = []
    partitions = psutil.disk_partitions()
    for partition in partitions:
        if 'removable' in partition.opts:
            drive_letter = partition.device
            try:
                volume_name = win32api.GetVolumeInformation(drive_letter)[0]
            except Exception:
                volume_name = "Unknown"
            usb_drives.append((volume_name, drive_letter))
    return usb_drives

def get_last_music(path):
    max_number = 0  # Valeur par défaut si aucun fichier valide n'est trouvé

    if not os.path.isdir(path):
        print(f"❌ Erreur : Le chemin '{path}' n'existe pas ou n'est pas un dossier.")
        return max_number

    for filename in os.listdir(path):
        if filename.endswith(".mp3"):
            parts = filename.split()  # Sépare le nom en mots
            if parts and parts[0].isdigit():  # Vérifie si le premier élément est un nombre
                num = int(parts[0])
                max_number = max(max_number, num)

    musiques["last_musique"] = max_number
    return max_number


@app.route('/api/dl', methods=['POST'])
def download_mp3():
    try:
        data = request.json
        print("données recu : ", data['url'])

        video_url = data['url']

        if not video_url:
            return jsonify({"error": "Aucune URL fournie"}), 400

        print(f"🔹 Téléchargement de l'audio depuis : {video_url}")

        # Définition du chemin de sortie
        title = str(musiques['last_musique']+1)+" "+data['title']

        output_path = os.path.join(USB['usb_path'] , title)

        # Commande yt-dlp pour extraire l’audio en MP3
        command = [
            "yt-dlp", "-x", "--audio-format", "mp3",
            "-o", output_path, video_url
        ]

        print("📥 Début du téléchargement...")

        # ✅ Exécuter la commande et attendre la fin
        result = subprocess.run(command, capture_output=True, text=True)
        print("📥 Sortie yt-dlp :", result.stdout)
        print("❌ Erreur yt-dlp :", result.stderr)

        if result.returncode != 0:
            return jsonify({"error": "Erreur lors du téléchargement"}), 500

        print("✅ Téléchargement terminé :", output_path)

        #changer nb musiques
        musiques['last_musique'] = musiques['last_musique']+1

        return jsonify({"success": True, "nb_musique": musiques['last_musique']})

    except Exception as e:
        print(str(e))
        return jsonify({"success": False, "error": str(e)})


@app.route('/api/get_usb', methods=['GET'])
def update_usb():
    usb_drivers = get_usb_drives()

    response = {
        'usb_name': 'None',
        'last_music': ''
    }
    l = len(usb_drivers)

    if l==1:
        USB["usb_name"] = usb_drivers[0][0]
        USB["usb_path"] = usb_drivers[0][1]

        response['usb_name'] = USB["usb_name"]
        response['last_music'] = get_last_music(USB["usb_path"])
        
    
    return jsonify(response)




if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
