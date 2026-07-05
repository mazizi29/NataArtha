param()

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$repoRoot = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $repoRoot 'Aset'
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

function Measure-TextWidth {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font
    )

    $format = New-Object System.Drawing.StringFormat
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
    $size = $Graphics.MeasureString($Text, $Font, [int]::MaxValue, $format)
    return [math]::Ceiling($size.Width)
}

function Render-SnippetImage {
    param(
        [string]$FilePath,
        [int]$StartLine,
        [int]$EndLine
    )

    $allLines = [System.IO.File]::ReadAllLines($FilePath)
    if ($StartLine -lt 1 -or $EndLine -gt $allLines.Length -or $StartLine -gt $EndLine) {
        throw "Invalid line range for ${FilePath}: $StartLine-$EndLine"
    }

    $selected = $allLines[($StartLine - 1)..($EndLine - 1)]
    $displayName = Split-Path $FilePath -Leaf
    $title = "$displayName`:$StartLine-$EndLine"

    $measureBitmap = New-Object System.Drawing.Bitmap 1, 1
    $measureGraphics = [System.Drawing.Graphics]::FromImage($measureBitmap)
    $measureGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    $titleFont = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
    $codeFont = New-Object System.Drawing.Font('Consolas', 14, [System.Drawing.FontStyle]::Regular)

    $padding = 28
    $headerHeight = 54
    $lineHeight = [math]::Ceiling($codeFont.GetHeight($measureGraphics) + 8)
    $lineNumberDigits = $EndLine.ToString().Length
    $lineNumberSample = ('9' * $lineNumberDigits)
    $lineNumberWidth = Measure-TextWidth -Graphics $measureGraphics -Text $lineNumberSample -Font $codeFont

    $processedLines = foreach ($line in $selected) {
        if ([string]::IsNullOrWhiteSpace($line)) { ' ' } else { $line.Replace("`t", '    ') }
    }

    $maxCodeWidth = 0
    foreach ($line in $processedLines) {
        $w = Measure-TextWidth -Graphics $measureGraphics -Text $line -Font $codeFont
        if ($w -gt $maxCodeWidth) { $maxCodeWidth = $w }
    }

    $titleWidth = Measure-TextWidth -Graphics $measureGraphics -Text $title -Font $titleFont
    $imageWidth = [math]::Max(920, [math]::Min(1900, [math]::Max($titleWidth, $lineNumberWidth + $maxCodeWidth + 120) + ($padding * 2)))
    $imageHeight = $headerHeight + ($selected.Count * $lineHeight) + ($padding * 2) + 12

    $measureGraphics.Dispose()
    $measureBitmap.Dispose()

    $bmp = New-Object System.Drawing.Bitmap $imageWidth, $imageHeight
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $gfx.Clear([System.Drawing.ColorTranslator]::FromHtml('#1e1e1e'))

    $headerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#252526'))
    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#1e1e1e'))
    $titleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#c5c5c5'))
    $lineNumberBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#858585'))
    $codeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#d4d4d4'))
    $accentBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#4fc1ff'))

    try {
        $gfx.FillRectangle($headerBrush, 0, 0, $imageWidth, $headerHeight)
        $gfx.FillRectangle($panelBrush, 0, $headerHeight, $imageWidth, $imageHeight - $headerHeight)

        $gfx.DrawString($title, $titleFont, $titleBrush, $padding, 14)
        $gfx.DrawRectangle((New-Object System.Drawing.Pen($accentBrush, 1)), $padding, 12, [math]::Max(1, $titleWidth + 12), 28)

        $codeX = $padding + 36
        $lineNumberX = $padding
        $y = $headerHeight + $padding - 2

        for ($i = 0; $i -lt $processedLines.Count; $i++) {
            $lineNumber = ($StartLine + $i).ToString()
            $text = $processedLines[$i]

            $gfx.DrawString($lineNumber, $codeFont, $lineNumberBrush, $lineNumberX, $y)
            $gfx.DrawString($text, $codeFont, $codeBrush, $codeX, $y)
            $y += $lineHeight
        }
    }
    finally {
        $headerBrush.Dispose()
        $panelBrush.Dispose()
        $titleBrush.Dispose()
        $lineNumberBrush.Dispose()
        $codeBrush.Dispose()
        $accentBrush.Dispose()
        $titleFont.Dispose()
        $codeFont.Dispose()
        $gfx.Dispose()
    }

    $safeName = "$displayName`_$StartLine-$EndLine.png"
    $outputPath = Join-Path $assetDir $safeName
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    Write-Output $outputPath
}

$targets = @(
    @{ File = Join-Path $repoRoot 'App.js'; Start = 1; End = 13 },
    @{ File = Join-Path $repoRoot 'app.json'; Start = 1; End = 22 },
    @{ File = Join-Path $repoRoot 'src\navigation\AppNavigator.js'; Start = 1; End = 97 },
    @{ File = Join-Path $repoRoot 'src\screens\LoginScreen.js'; Start = 21; End = 22 },
    @{ File = Join-Path $repoRoot 'src\screens\LoginScreen.js'; Start = 80; End = 116 },
    @{ File = Join-Path $repoRoot 'src\screens\DashboardScreen.js'; Start = 16; End = 26 },
    @{ File = Join-Path $repoRoot 'src\screens\DashboardScreen.js'; Start = 211; End = 221 },
    @{ File = Join-Path $repoRoot 'src\screens\DashboardScreen.js'; Start = 203; End = 322 },
    @{ File = Join-Path $repoRoot 'src\screens\AddTransactionScreen.js'; Start = 17; End = 17 },
    @{ File = Join-Path $repoRoot 'src\screens\AddTransactionScreen.js'; Start = 93; End = 103 },
    @{ File = Join-Path $repoRoot 'src\screens\AddTransactionScreen.js'; Start = 165; End = 184 },
    @{ File = Join-Path $repoRoot 'src\screens\AddTransactionScreen.js'; Start = 295; End = 313 },
    @{ File = Join-Path $repoRoot 'src\screens\AddTransactionScreen.js'; Start = 377; End = 381 },
    @{ File = Join-Path $repoRoot 'src\screens\TransactionHistoryScreen.js'; Start = 27; End = 39 },
    @{ File = Join-Path $repoRoot 'src\screens\TransactionHistoryScreen.js'; Start = 77; End = 92 },
    @{ File = Join-Path $repoRoot 'src\components\ButtonPrimary.js'; Start = 1; End = 20 },
    @{ File = Join-Path $repoRoot 'src\services\firebase.js'; Start = 1; End = 19 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 25; End = 27 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 371; End = 377 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 399; End = 407 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 423; End = 432 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 452; End = 483 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 500; End = 529 },
    @{ File = Join-Path $repoRoot 'src\context\AuthContext.js'; Start = 54; End = 67 },
    @{ File = Join-Path $repoRoot 'src\context\AuthContext.js'; Start = 80; End = 95 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 537; End = 556 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 563; End = 577 },
    @{ File = Join-Path $repoRoot 'src\services\api.js'; Start = 604; End = 609 }
)

foreach ($target in $targets) {
    try {
        $path = Render-SnippetImage -FilePath $target.File -StartLine $target.Start -EndLine $target.End
        Write-Output $path
    }
    catch {
        Write-Error $_
        exit 1
    }
}
