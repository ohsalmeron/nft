# PowerShell script to convert JPG to WebP with 3-digit zero-padding
# This script uses ImageMagick if available, or provides instructions for manual conversion

param(
    [string]$InputDir = "Genesis",
    [string]$OutputDir = "assets",
    [int]$Quality = 85
)

Write-Host "JPG to WebP Converter" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

# Check if ImageMagick is available
$magickPath = Get-Command magick -ErrorAction SilentlyContinue

if ($magickPath) {
    Write-Host "Found ImageMagick at: $($magickPath.Source)" -ForegroundColor Yellow
    
    # Create output directory
    if (!(Test-Path $OutputDir)) {
        New-Item -ItemType Directory -Path $OutputDir | Out-Null
        Write-Host "Created output directory: $OutputDir" -ForegroundColor Yellow
    }
    
    # Get all JPG files
    $jpgFiles = Get-ChildItem -Path $InputDir -Filter "*.jpg" | Sort-Object Name
    
    if ($jpgFiles.Count -eq 0) {
        Write-Host "No JPG files found in $InputDir" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Found $($jpgFiles.Count) JPG files to convert" -ForegroundColor Yellow
    
    $converted = 0
    $skipped = 0
    
    foreach ($file in $jpgFiles) {
        # Extract number and pad to 3 digits
        $number = [int]$file.BaseName
        $paddedNumber = $number.ToString("000")
        $outputFile = Join-Path $OutputDir "$paddedNumber.webp"
        
        if (Test-Path $outputFile) {
            Write-Host "SKIP: $paddedNumber.webp already exists" -ForegroundColor Yellow
            $skipped++
            continue
        }
        
        try {
            # Convert using ImageMagick
            & magick $file.FullName -quality $Quality -define webp:lossless=false $outputFile
            
            # Get file sizes for comparison
            $inputSize = (Get-Item $file.FullName).Length
            $outputSize = (Get-Item $outputFile).Length
            $compressionRatio = [math]::Round((1 - $outputSize / $inputSize) * 100, 1)
            
            Write-Host "CONVERTED: $($file.Name) -> $paddedNumber.webp ($inputSize -> $outputSize bytes, $compressionRatio% smaller)" -ForegroundColor Green
            $converted++
        }
        catch {
            Write-Host "ERROR: Failed to convert $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host "`nConversion Summary:" -ForegroundColor Green
    Write-Host "  Converted: $converted" -ForegroundColor White
    Write-Host "  Skipped:   $skipped" -ForegroundColor White
    Write-Host "  Total:     $($jpgFiles.Count)" -ForegroundColor White
    
} else {
    Write-Host "ImageMagick not found. Here are your options:" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: Install ImageMagick" -ForegroundColor Yellow
    Write-Host "  Download from: https://imagemagick.org/script/download.php#windows" -ForegroundColor White
    Write-Host "  Or use chocolatey: choco install imagemagick" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use online converter" -ForegroundColor Yellow
    Write-Host "  Upload your JPG files to: https://convertio.co/jpg-webp/" -ForegroundColor White
    Write-Host "  Download as: 001.webp, 002.webp, 003.webp, etc." -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Use Python with PIL (if you can install it)" -ForegroundColor Yellow
    Write-Host "  Run: python scripts/convert_jpg_to_webp.py" -ForegroundColor White
    Write-Host ""
    Write-Host "File naming pattern needed:" -ForegroundColor Cyan
    Write-Host "  1.jpg -> 001.webp" -ForegroundColor White
    Write-Host "  25.jpg -> 025.webp" -ForegroundColor White
    Write-Host "  300.jpg -> 300.webp" -ForegroundColor White
}

Write-Host "`nScript completed." -ForegroundColor Green
