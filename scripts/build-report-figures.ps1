param()

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $repoRoot 'Aset'
New-Item -ItemType Directory -Force -Path $assetDir | Out-Null

function New-Brush {
    param([string]$Hex)
    return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($Hex))
}

function Measure-Text {
    param(
        [System.Drawing.Graphics]$Graphics,
        [string]$Text,
        [System.Drawing.Font]$Font,
        [int]$MaxWidth = 5000
    )
    $format = New-Object System.Drawing.StringFormat
    $format.FormatFlags = [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
    return $Graphics.MeasureString($Text, $Font, $MaxWidth, $format)
}

function Render-TextFigure {
    param(
        [string]$OutputName,
        [string]$Title,
        [string]$Subtitle,
        [string[]]$Lines
    )

    $fontMeasureBmp = New-Object System.Drawing.Bitmap 1, 1
    $fontGfx = [System.Drawing.Graphics]::FromImage($fontMeasureBmp)
    $fontGfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $titleFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
    $monoFont = New-Object System.Drawing.Font('Consolas', 13, [System.Drawing.FontStyle]::Regular)

    $padding = 28
    $headerHeight = 72
    $lineHeight = [math]::Ceiling($monoFont.GetHeight($fontGfx) + 5)
    $maxWidth = 0
    foreach ($line in $Lines) {
        $w = (Measure-Text -Graphics $fontGfx -Text $line -Font $monoFont).Width
        if ($w -gt $maxWidth) { $maxWidth = $w }
    }
    $titleWidth = (Measure-Text -Graphics $fontGfx -Text $Title -Font $titleFont).Width
    $subtitleWidth = (Measure-Text -Graphics $fontGfx -Text $Subtitle -Font $subtitleFont).Width
    $contentWidth = [math]::Max($maxWidth, [math]::Max($titleWidth, $subtitleWidth))
    $imageWidth = [math]::Max(980, [math]::Ceiling($contentWidth + ($padding * 2) + 40))
    $imageHeight = $headerHeight + ($Lines.Count * $lineHeight) + ($padding * 2) + 24

    $fontGfx.Dispose()
    $fontMeasureBmp.Dispose()

    $bmp = New-Object System.Drawing.Bitmap $imageWidth, $imageHeight
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $gfx.Clear([System.Drawing.ColorTranslator]::FromHtml('#1e1e1e'))

    $headerBrush = New-Brush '#252526'
    $panelBrush = New-Brush '#1e1e1e'
    $titleBrush = New-Brush '#d4d4d4'
    $subtitleBrush = New-Brush '#9aa0a6'
    $lineBrush = New-Brush '#d4d4d4'
    $accentBrush = New-Brush '#4fc1ff'

    try {
        $gfx.FillRectangle($headerBrush, 0, 0, $imageWidth, $headerHeight)
        $gfx.FillRectangle($panelBrush, 0, $headerHeight, $imageWidth, $imageHeight - $headerHeight)
        $gfx.DrawString($Title, $titleFont, $titleBrush, $padding, 12)
        $gfx.DrawString($Subtitle, $subtitleFont, $subtitleBrush, $padding, 42)
        $gfx.DrawRectangle((New-Object System.Drawing.Pen($accentBrush, 1)), $padding, 10, [math]::Max(1, $titleWidth + 12), 34)

        $y = $headerHeight + $padding - 2
        foreach ($line in $Lines) {
            $gfx.DrawString($line, $monoFont, $lineBrush, $padding, $y)
            $y += $lineHeight
        }
    }
    finally {
        $headerBrush.Dispose()
        $panelBrush.Dispose()
        $titleBrush.Dispose()
        $subtitleBrush.Dispose()
        $lineBrush.Dispose()
        $accentBrush.Dispose()
        $titleFont.Dispose()
        $subtitleFont.Dispose()
        $monoFont.Dispose()
        $gfx.Dispose()
    }

    $outputPath = Join-Path $assetDir $OutputName
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    return $outputPath
}

function Render-CompositeFigure {
    param(
        [string]$OutputName,
        [string]$Title,
        [string]$Subtitle,
        [string[]]$ImagePaths
    )

    $images = @()
    try {
        foreach ($path in $ImagePaths) {
            $images += [System.Drawing.Image]::FromFile($path)
        }

        $padding = 24
        $gap = 18
        $headerHeight = 72
        $labelHeight = 0
        $maxWidth = ($images | Measure-Object Width -Maximum).Maximum
        $contentHeight = ($images | Measure-Object Height -Sum).Sum + ($gap * ([math]::Max(0, $images.Count - 1)))
            $imageWidth = [math]::Max(980, [math]::Ceiling($maxWidth + ($padding * 2)))
        $imageHeight = $headerHeight + $contentHeight + ($padding * 2) + 12

        $bmp = New-Object System.Drawing.Bitmap $imageWidth, $imageHeight
        $gfx = [System.Drawing.Graphics]::FromImage($bmp)
        $gfx.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gfx.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
        $gfx.Clear([System.Drawing.ColorTranslator]::FromHtml('#1e1e1e'))

        $headerBrush = New-Brush '#252526'
        $panelBrush = New-Brush '#1e1e1e'
        $titleBrush = New-Brush '#d4d4d4'
        $subtitleBrush = New-Brush '#9aa0a6'
        $accentBrush = New-Brush '#4fc1ff'
        $titleFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
        $subtitleFont = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)

        try {
            $gfx.FillRectangle($headerBrush, 0, 0, $imageWidth, $headerHeight)
            $gfx.FillRectangle($panelBrush, 0, $headerHeight, $imageWidth, $imageHeight - $headerHeight)
            $gfx.DrawString($Title, $titleFont, $titleBrush, $padding, 12)
            $gfx.DrawString($Subtitle, $subtitleFont, $subtitleBrush, $padding, 42)
            $gfx.DrawRectangle((New-Object System.Drawing.Pen($accentBrush, 1)), $padding, 10, 360, 34)

            $currentY = $headerHeight + $padding
            foreach ($img in $images) {
                $drawWidth = [math]::Min($img.Width, $imageWidth - ($padding * 2))
                $drawHeight = [math]::Round($img.Height * ($drawWidth / $img.Width))
                $destX = [math]::Round(($imageWidth - $drawWidth) / 2)
                $rect = New-Object System.Drawing.Rectangle ([int]$destX), ([int]$currentY), ([int]$drawWidth), ([int]$drawHeight)
                $gfx.DrawImage($img, $rect)
                $currentY += $drawHeight + $gap
            }
        }
        finally {
            $headerBrush.Dispose()
            $panelBrush.Dispose()
            $titleBrush.Dispose()
            $subtitleBrush.Dispose()
            $accentBrush.Dispose()
            $titleFont.Dispose()
            $subtitleFont.Dispose()
            $gfx.Dispose()
        }

        $outputPath = Join-Path $assetDir $OutputName
        $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        return $outputPath
    }
    finally {
        foreach ($img in $images) { $img.Dispose() }
    }
}

$treeLines = @(
    'FinanceApp v2/',
    '+-- App.js',
    '+-- app.json',
    '+-- src/',
    '|   +-- components/',
    '|   |   +-- ButtonPrimary.js',
    '|   |   +-- InputField.js',
    '|   |   +-- TransactionItem.js',
    '|   +-- context/',
    '|   |   +-- AuthContext.js',
    '|   +-- navigation/',
    '|   |   +-- AppNavigator.js',
    '|   +-- screens/',
    '|   |   +-- AddTransactionScreen.js',
    '|   |   +-- DashboardScreen.js',
    '|   |   +-- LoginScreen.js',
    '|   |   +-- RegisterScreen.js',
    '|   |   +-- TransactionHistoryScreen.js',
    '|   +-- services/',
    '|   |   +-- api.js',
    '|   |   +-- firebase.js',
    '|   +-- styles/',
    '|   |   +-- globalStyles.js',
    '|   +-- utils/',
    '|       +-- alertHelper.js',
    '|       +-- formatCurrency.js',
    '+-- scripts/',
    '|   +-- generate-snippet-images.ps1',
    '+-- Aset/'
)

$figures = @()
$figures += Render-TextFigure -OutputName 'Gambar_4.1.1_Struktur_Direktori_Proyek_NataArtha.png' -Title 'Gambar 4.1.1 Struktur Direktori Proyek NataArtha' -Subtitle 'Arsitektur modular proyek di VS Code Explorer' -Lines $treeLines
$figures += Render-CompositeFigure -OutputName 'Gambar_4.1.2_Implementasi_Appjs_dan_appjson.png' -Title 'Gambar 4.1.2 Implementasi App.js dan app.json' -Subtitle 'Root aplikasi dan konfigurasi platform Expo' -ImagePaths @(
    (Join-Path $assetDir 'App.js_1-13.png'),
    (Join-Path $assetDir 'app.json_1-22.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.1.3_Implementasi_AppNavigator.png' -Title 'Gambar 4.1.3 Implementasi AppNavigator' -Subtitle 'Flow navigasi berbasis autentikasi' -ImagePaths @(
    (Join-Path $assetDir 'AppNavigator.js_1-97.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.1.4_Implementasi_AuthContext_dan_Restore_Session.png' -Title 'Gambar 4.1.4 Implementasi AuthContext dan Restore Session' -Subtitle 'State management dan session restore' -ImagePaths @(
    (Join-Path $assetDir 'AuthContext.js_54-67.png'),
    (Join-Path $assetDir 'AuthContext.js_80-95.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.2.1_Implementasi_Reusable_Component_dan_Halaman_Login_Web.png' -Title 'Gambar 4.2.1 Implementasi Reusable Component dan Halaman Login Web' -Subtitle 'Reusable button dan struktur login screen untuk web' -ImagePaths @(
    (Join-Path $assetDir 'ButtonPrimary.js_1-20.png'),
    (Join-Path $assetDir 'LoginScreen.js_21-22.png'),
    (Join-Path $assetDir 'LoginScreen.js_80-116.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.2.2_Implementasi_Dashboard_dan_Grafik_SVG_di_Browser.png' -Title 'Gambar 4.2.2 Implementasi Dashboard dan Grafik SVG di Browser' -Subtitle 'Chart rendering react-native-svg dan fetch dashboard insights' -ImagePaths @(
    (Join-Path $assetDir 'DashboardScreen.js_16-26.png'),
    (Join-Path $assetDir 'DashboardScreen.js_211-221.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.2.3_Implementasi_Form_Tambah_Transaksi_Berbasis_Web.png' -Title 'Gambar 4.2.3 Implementasi Form Tambah Transaksi Berbasis Web' -Subtitle 'Input nominal, kategori, tanggal, dan validasi form' -ImagePaths @(
    (Join-Path $assetDir 'AddTransactionScreen.js_17-17.png'),
    (Join-Path $assetDir 'AddTransactionScreen.js_93-103.png'),
    (Join-Path $assetDir 'AddTransactionScreen.js_165-184.png'),
    (Join-Path $assetDir 'AddTransactionScreen.js_377-381.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.2.4_Implementasi_Riwayat_Transaksi_pada_Browser.png' -Title 'Gambar 4.2.4 Implementasi Riwayat Transaksi pada Browser' -Subtitle 'Dynamic refresh, edit/delete action, dan rendering list' -ImagePaths @(
    (Join-Path $assetDir 'TransactionHistoryScreen.js_27-39.png'),
    (Join-Path $assetDir 'TransactionHistoryScreen.js_77-92.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.3.1_Implementasi_Firebase_dan_Registrasi_Pengguna.png' -Title 'Gambar 4.3.1 Implementasi Firebase dan Registrasi Pengguna' -Subtitle 'Firebase Auth dan Firestore users collection' -ImagePaths @(
    (Join-Path $assetDir 'firebase.js_1-19.png'),
    (Join-Path $assetDir 'api.js_399-407.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.3.2_Implementasi_Offline_Queue_dengan_AsyncStorage.png' -Title 'Gambar 4.3.2 Implementasi Offline Queue dengan AsyncStorage' -Subtitle 'Fallback transaksi pending dan flush saat login' -ImagePaths @(
    (Join-Path $assetDir 'api.js_452-483.png'),
    (Join-Path $assetDir 'api.js_500-529.png'),
    (Join-Path $assetDir 'AuthContext.js_80-95.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.3.3_Implementasi_CRUD_dan_Dashboard_Aggregation.png' -Title 'Gambar 4.3.3 Implementasi CRUD dan Dashboard Aggregation' -Subtitle 'Query Firestore, summary calculation, dan chartSeries' -ImagePaths @(
    (Join-Path $assetDir 'api.js_423-432.png'),
    (Join-Path $assetDir 'api.js_537-556.png'),
    (Join-Path $assetDir 'api.js_563-577.png'),
    (Join-Path $assetDir 'api.js_604-609.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.4.1_Implementasi_Conditional_Rendering_Platform_Web.png' -Title 'Gambar 4.4.1 Implementasi Conditional Rendering Platform Web' -Subtitle 'Platform.OS === web dan web-specific component rendering' -ImagePaths @(
    (Join-Path $assetDir 'AddTransactionScreen.js_295-313.png'),
    (Join-Path $assetDir 'AddTransactionScreen.js_377-381.png')
)
$figures += Render-CompositeFigure -OutputName 'Gambar_4.4.2_Pengujian_Responsive_Layout_pada_Browser.png' -Title 'Gambar 4.4.2 Pengujian Responsive Layout pada Browser' -Subtitle 'Logika adaptasi layout berdasarkan lebar layar (useWindowDimensions)' -ImagePaths @(
    (Join-Path $assetDir 'DashboardScreen.js_203-322.png')
)

$figures | ForEach-Object { Write-Output $_ }
