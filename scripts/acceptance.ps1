$base = 'http://localhost:8080'

# wait for backend
$ok = $false
for ($i = 0; $i -lt 50; $i++) {
  try {
    $h = Invoke-RestMethod -Method Get -Uri "$base/health" -TimeoutSec 2
    if ($h -eq 'ok') { $ok = $true; break }
  } catch {
    Start-Sleep -Seconds 1
  }
}
if (-not $ok) {
  throw 'Backend not ready on /health (check backend.out.log/backend.err.log)'
}

# create room
$roomBody = @{ title = 'E2E房间'; subject = '测试'; description = '验收脚本创建' } | ConvertTo-Json
$room = Invoke-RestMethod -Method Post -Uri "$base/api/rooms" -ContentType 'application/json' -Body $roomBody
$roomId = $room.id
Write-Host "Created roomId=$roomId"

# get room detail
$r = Invoke-RestMethod -Method Get -Uri "$base/api/rooms/$roomId"
Write-Host "Room title=$($r.title)"

# coins before
$c0 = Invoke-RestMethod -Method Get -Uri "$base/api/rooms/$roomId/coins"
Write-Host "Coins before=$($c0.totalCoins) lastAt=$($c0.lastTransactionAt)"

# post pomodoro SUCCESS
$pBody = @{ durationMinutes = 25; result = 'SUCCESS' } | ConvertTo-Json
$p = Invoke-RestMethod -Method Post -Uri "$base/api/rooms/$roomId/pomodoros" -ContentType 'application/json' -Body $pBody
Write-Host "Pomodoro created id=$($p.id) awarded=$($p.awardedCoins)"

# coins after
$c1 = Invoke-RestMethod -Method Get -Uri "$base/api/rooms/$roomId/coins"
Write-Host "Coins after=$($c1.totalCoins) lastAt=$($c1.lastTransactionAt)"

# list pomodoros
$plist = Invoke-RestMethod -Method Get -Uri "$base/api/rooms/$roomId/pomodoros"
Write-Host "Pomodoros count=$($plist.Count)"

# invalid payload -> 400
try {
  $bad = @{ durationMinutes = -1; result = 'SUCCESS' } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "$base/api/rooms/$roomId/pomodoros" -ContentType 'application/json' -Body $bad | Out-Null
  throw 'Expected 400 but got success'
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 400) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $bodyText = $reader.ReadToEnd()
    Write-Host "Bad request 400 OK: $bodyText"
  } else {
    throw
  }
}

# not found -> 404
try {
  Invoke-RestMethod -Method Get -Uri "$base/api/rooms/999999" | Out-Null
  throw 'Expected 404 but got success'
} catch {
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 404) {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $bodyText = $reader.ReadToEnd()
    Write-Host "Not found 404 OK: $bodyText"
  } else {
    throw
  }
}
