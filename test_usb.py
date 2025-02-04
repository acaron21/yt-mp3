import psutil
import win32api

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

# Affichage des clés USB connectées
usb_list = get_usb_drives()
# for name, path in usb_list:
#     print(f"Nom: {name}, Chemin: {path}")
print(f"name : {usb_list[0][0]}")
