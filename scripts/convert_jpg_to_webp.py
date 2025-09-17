#!/usr/bin/env python3
"""
JPG to WebP Converter
Converts JPG files from Genesis/ folder to WebP format with 3-digit zero-padding
Preserves original JPG files and optimizes WebP for size
"""

import os
import sys
from pathlib import Path
from PIL import Image
import argparse

def log(message):
    """Simple logging function"""
    print(f"[CONVERT] {message}")

def convert_jpg_to_webp(input_dir="Genesis", output_dir="assets", quality=85, optimize=True):
    """
    Convert JPG files to WebP format with 3-digit zero-padding
    
    Args:
        input_dir: Directory containing JPG files (default: Genesis)
        output_dir: Directory to save WebP files (default: assets)
        quality: WebP quality (1-100, default: 85)
        optimize: Whether to optimize WebP (default: True)
    """
    
    # Setup paths
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    
    # Create output directory if it doesn't exist
    output_path.mkdir(exist_ok=True)
    
    if not input_path.exists():
        log(f"ERROR: Input directory '{input_dir}' does not exist!")
        return False
    
    # Find all JPG files
    jpg_files = list(input_path.glob("*.jpg")) + list(input_path.glob("*.jpeg"))
    
    if not jpg_files:
        log(f"ERROR: No JPG files found in '{input_dir}'!")
        return False
    
    log(f"Found {len(jpg_files)} JPG files to convert")
    
    converted_count = 0
    skipped_count = 0
    error_count = 0
    
    for jpg_file in sorted(jpg_files):
        try:
            # Extract number from filename (e.g., "1.jpg" -> "1", "25.jpg" -> "25")
            file_number = jpg_file.stem
            
            # Convert to 3-digit zero-padded format
            padded_number = file_number.zfill(3)
            webp_filename = f"{padded_number}.webp"
            webp_path = output_path / webp_filename
            
            # Check if WebP already exists
            if webp_path.exists():
                log(f"SKIP: {webp_filename} already exists")
                skipped_count += 1
                continue
            
            # Open and convert image
            with Image.open(jpg_file) as img:
                # Convert to RGB if necessary (WebP doesn't support all modes)
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Convert RGBA to RGB with white background
                    if img.mode == 'RGBA':
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                        img = background
                    else:
                        img = img.convert('RGB')
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Save as WebP with optimization
                save_kwargs = {
                    'format': 'WEBP',
                    'quality': quality,
                    'optimize': optimize,
                    'method': 6  # Best compression method
                }
                
                img.save(webp_path, **save_kwargs)
                
                # Get file sizes for comparison
                jpg_size = jpg_file.stat().st_size
                webp_size = webp_path.stat().st_size
                compression_ratio = (1 - webp_size / jpg_size) * 100
                
                log(f"CONVERTED: {jpg_file.name} -> {webp_filename} "
                    f"({jpg_size:,} -> {webp_size:,} bytes, {compression_ratio:.1f}% smaller)")
                
                converted_count += 1
                
        except Exception as e:
            log(f"ERROR: Failed to convert {jpg_file.name}: {e}")
            error_count += 1
    
    # Summary
    log("=" * 50)
    log("CONVERSION SUMMARY:")
    log(f"  Converted: {converted_count}")
    log(f"  Skipped:   {skipped_count}")
    log(f"  Errors:    {error_count}")
    log(f"  Total:     {len(jpg_files)}")
    
    if converted_count > 0:
        log(f"WebP files saved to: {output_path.absolute()}")
    
    return error_count == 0

def main():
    """Main function with command line argument parsing"""
    parser = argparse.ArgumentParser(description="Convert JPG files to WebP format with 3-digit zero-padding")
    parser.add_argument("--input", "-i", default="Genesis", help="Input directory containing JPG files (default: Genesis)")
    parser.add_argument("--output", "-o", default="assets", help="Output directory for WebP files (default: assets)")
    parser.add_argument("--quality", "-q", type=int, default=85, help="WebP quality 1-100 (default: 85)")
    parser.add_argument("--no-optimize", action="store_true", help="Disable WebP optimization")
    
    args = parser.parse_args()
    
    # Validate quality
    if not 1 <= args.quality <= 100:
        log("ERROR: Quality must be between 1 and 100")
        sys.exit(1)
    
    log("JPG to WebP Converter")
    log("=" * 50)
    log(f"Input directory:  {args.input}")
    log(f"Output directory: {args.output}")
    log(f"Quality:          {args.quality}")
    log(f"Optimize:         {not args.no_optimize}")
    log("=" * 50)
    
    # Convert files
    success = convert_jpg_to_webp(
        input_dir=args.input,
        output_dir=args.output,
        quality=args.quality,
        optimize=not args.no_optimize
    )
    
    if success:
        log("Conversion completed successfully!")
        sys.exit(0)
    else:
        log("Conversion completed with errors!")
        sys.exit(1)

if __name__ == "__main__":
    main()
