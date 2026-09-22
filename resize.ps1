Add-Type -AssemblyName System.Drawing

function Resize-Image {
    param(
        [string]$ImagePath,
        [string]$OutputPath,
        [int]$MaxWidth,
        [int]$MaxHeight,
        [long]$Quality = 80L
    )
    
    $img = [System.Drawing.Image]::FromFile($ImagePath)
    
    $ratioX = [double]$MaxWidth / $img.Width
    $ratioY = [double]$MaxHeight / $img.Height
    $ratio = [Math]::Min($ratioX, $ratioY)
    
    if ($ratio -ge 1) {
        $newWidth = $img.Width
        $newHeight = $img.Height
    } else {
        $newWidth = [int]($img.Width * $ratio)
        $newHeight = [int]($img.Height * $ratio)
    }
    
    $newImg = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graph = [System.Drawing.Graphics]::FromImage($newImg)
    $graph.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
    
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageDecoders() | Where-Object { $_.FormatID -eq $img.RawFormat.Guid }
    if (-not $codec) {
        # Fallback to PNG if codec not found
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageDecoders() | Where-Object { $_.FormatID -eq [System.Drawing.Imaging.ImageFormat]::Png.Guid }
    }
    
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $Quality)
    
    $newImg.Save($OutputPath, $codec[0], $encParams)
    
    $graph.Dispose()
    $newImg.Dispose()
    $img.Dispose()
}

Resize-Image -ImagePath 'IMG20260907095108.jpg' -OutputPath 'IMG20260907095108_sm.jpg' -MaxWidth 800 -MaxHeight 800
Resize-Image -ImagePath 'logo.png' -OutputPath 'logo_sm.png' -MaxWidth 300 -MaxHeight 100
Resize-Image -ImagePath 'favicon.png' -OutputPath 'favicon_sm.png' -MaxWidth 192 -MaxHeight 192

