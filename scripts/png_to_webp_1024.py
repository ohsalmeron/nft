import os
import subprocess
import json
from PIL import Image

ASSETS_DIR = 'assets'
METADATA_DIR = 'metadata'
TARGET_SIZE = (1024, 1024)
AUTHOR = "Omar Hernandez Salmeron"
PROJECT = "Cosmicrafts"

def dict_to_xmp_dc(metadata):
    # Map fields to standard XMP/DC fields
    title = metadata.get('name', '')
    description = metadata.get('description', '')
    author = metadata.get('author', AUTHOR)
    project = metadata.get('project', PROJECT)
    # Compose subject from project and attributes
    subjects = [project]
    if 'attributes' in metadata and isinstance(metadata['attributes'], list):
        for attr in metadata['attributes']:
            if isinstance(attr, dict):
                trait = attr.get('trait_type', '')
                value = attr.get('value', '')
                if trait and value:
                    subjects.append(f"{trait}: {value}")
    subject_str = ', '.join(subjects)
    # Build XMP
    xmp = f'''<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    dc:title="{title}"
    dc:description="{description}"
    dc:creator="{author}"
    dc:subject="{subject_str}"
  />
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>'''
    return xmp

for filename in os.listdir(ASSETS_DIR):
    if not filename.lower().endswith('.png'):
        continue
    png_path = os.path.join(ASSETS_DIR, filename)
    webp_path = os.path.splitext(png_path)[0] + '.webp'
    base = os.path.splitext(filename)[0]
    meta_path = os.path.join(METADATA_DIR, base + '.json')
    # Read metadata JSON if it exists
    metadata = {}
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            metadata = json.load(f)
    # Add author and project if not present
    if 'author' not in metadata:
        metadata['author'] = AUTHOR
    if 'project' not in metadata:
        metadata['project'] = PROJECT
    # Convert to XMP (Dublin Core)
    xmp_str = dict_to_xmp_dc(metadata)
    # Save webp
    with Image.open(png_path) as img:
        img = img.convert('RGBA')
        img = img.resize(TARGET_SIZE, Image.LANCZOS)
        img.save(webp_path, 'WEBP', quality=80, method=6)
        print(f"Converted {filename} -> {os.path.basename(webp_path)}")
    # Write XMP metadata to a temp file
    xmp_path = os.path.splitext(png_path)[0] + '.xmp'
    with open(xmp_path, 'w') as f:
        f.write(xmp_str)
    # Attach XMP to WebP using webpmux
    subprocess.run(['webpmux', '-set', 'xmp', xmp_path, webp_path, '-o', webp_path], check=True)
    os.remove(xmp_path)
    print(f"Embedded DC metadata as XMP in {os.path.basename(webp_path)}") 