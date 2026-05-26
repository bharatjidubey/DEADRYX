$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Listening on http://localhost:$port"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        $filePath = Join-Path $PWD $localPath
        $filePath = $filePath -replace "/", "\"

        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $content.Length
            
            if ($filePath -like "*.html") { $response.ContentType = "text/html" }
            elseif ($filePath -like "*.css") { $response.ContentType = "text/css" }
            elseif ($filePath -like "*.js") { $response.ContentType = "application/javascript" }
            
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} catch {
    Write-Host "Server stopped."
} finally {
    $listener.Stop()
}
