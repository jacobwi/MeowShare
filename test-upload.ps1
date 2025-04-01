# Test regular file upload
Write-Host "Testing regular file upload..."
$testFile = "test-small.txt"
"This is a test file for regular upload" | Out-File $testFile
curl -X POST -F "file=@$testFile" https://localhost:7222/api/files/quick-share

# Test chunked upload for a larger file
Write-Host "`nTesting chunked upload..."
$largeFile = "test-large.txt"
$fileId = [guid]::NewGuid().ToString()
$chunkSize = 1MB
$content = "A" * (5MB) # Create a 5MB test file
[System.IO.File]::WriteAllText($largeFile, $content)

$fileInfo = Get-Item $largeFile
$totalChunks = [Math]::Ceiling($fileInfo.Length / $chunkSize)

Write-Host "Uploading file in $totalChunks chunks..."

for ($i = 1; $i -le $totalChunks; $i++) {
    $start = ($i - 1) * $chunkSize
    $length = [Math]::Min($chunkSize, $fileInfo.Length - $start)
    $tempChunk = "chunk_$i.tmp"
    
    # Create chunk file
    $bytes = [System.IO.File]::ReadAllBytes($largeFile)[$start..($start + $length - 1)]
    [System.IO.File]::WriteAllBytes($tempChunk, $bytes)
    
    Write-Host "Uploading chunk $i of $totalChunks"
    curl -X POST `
         -F "Chunk=@$tempChunk" `
         -F "FileId=$fileId" `
         -F "ChunkNumber=$i" `
         -F "TotalChunks=$totalChunks" `
         -F "FileName=large-test-file.txt" `
         https://localhost:7222/api/files/upload/chunk
    
    Remove-Item $tempChunk
}

# Cleanup test files
Remove-Item $testFile
Remove-Item $largeFile

Write-Host "`nTest completed!"
