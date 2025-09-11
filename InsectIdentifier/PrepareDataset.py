import os
import requests
from PIL import Image
from io import BytesIO
import json

# Create directories for training data
os.makedirs("InsectDataset", exist_ok=True)
for insect in [
    "Bumblebee",
    "Honey Bee",
    "Ladybird",
    "Butterfly",
    "Dragonfly",
    "Moth",
    "Wasp",
    "Ant",
    "Fly",
    "Mosquito"
]:
    os.makedirs(f"InsectDataset/{insect}", exist_ok=True)

# Function to download images from iNaturalist API
def download_insect_images(insect_name, count=100):
    # iNaturalist API endpoint for observations
    url = f"https://api.inaturalist.org/v1/observations"
    params = {
        "taxon_name": insect_name,
        "quality_grade": "research",
        "has_photos": "true",
        "per_page": count
    }
    
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        for i, obs in enumerate(data.get("results", [])):
            if "photos" in obs and obs["photos"]:
                photo_url = obs["photos"][0]["url"]
                try:
                    img_response = requests.get(photo_url)
                    if img_response.status_code == 200:
                        img = Image.open(BytesIO(img_response.content))
                        # Save image
                        img.save(f"InsectDataset/{insect_name}/{i}.jpg")
                except Exception as e:
                    print(f"Error downloading image for {insect_name}: {e}")

# Download images for each insect
for insect in [
    "Bumblebee",
    "Honey Bee",
    "Ladybird",
    "Butterfly",
    "Dragonfly",
    "Moth",
    "Wasp",
    "Ant",
    "Fly",
    "Mosquito"
]:
    print(f"Downloading images for {insect}...")
    download_insect_images(insect)

print("Dataset preparation complete!") 