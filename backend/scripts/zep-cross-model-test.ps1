# Cross-model Zep memory test (OpenAI -> Gemini)
# Usage: .\\scripts\\zep-cross-model-test.ps1 [-ProjectId "<projectId>"]
param(
  [Parameter(Mandatory = $false)]
  [string]$ProjectId
)

$baseUrl = "http://localhost:3000"

# Resolve projectId if not provided
if (-not $ProjectId) {
  $projectsResponse = curl.exe "$baseUrl/api/projects"
  $projectsJson = $projectsResponse | ConvertFrom-Json
  if ($projectsJson.projects -and $projectsJson.projects.Count -gt 0) {
    $ProjectId = $projectsJson.projects[0].id
  } else {
    $createResponse = curl.exe -s -X POST "$baseUrl/api/projects" `
      -H "Content-Type: application/json" `
      --data-binary "{\"name\":\"Zep Cross-Model Test\"}"
    $createJson = $createResponse | ConvertFrom-Json
    $ProjectId = $createJson.projectId
  }
}

if (-not $ProjectId) {
  Write-Host "Could not resolve projectId. Ensure the server is running." -ForegroundColor Red
  exit 1
}

# OpenAI seed turn
@'
{"projectId":"__PROJECT_ID__","provider":"openai","model":"gpt-4o-mini","userText":"Remember this codeword for later: PURPLE-99."}
'@.Replace("__PROJECT_ID__", $ProjectId) | Set-Content payload-openai-zep.json

curl.exe -N -i -X POST "$baseUrl/api/chat/turn" `
  -H "Content-Type: application/json" `
  --data-binary "@payload-openai-zep.json" > chat-openai-zep.txt

# Gemini recall turn
@'
{"projectId":"__PROJECT_ID__","provider":"gemini","model":"gemini-2.5-flash-lite","userText":"What was the codeword I asked you to remember?"}
'@.Replace("__PROJECT_ID__", $ProjectId) | Set-Content payload-gemini-zep.json

curl.exe -N -i -X POST "$baseUrl/api/chat/turn" `
  -H "Content-Type: application/json" `
  --data-binary "@payload-gemini-zep.json" > chat-gemini-zep.txt

# Extract turnId from Gemini response
$turnLine = Select-String -Path chat-gemini-zep.txt -Pattern 'event: complete' -Context 0,1 | ForEach-Object { $_.Context.PostContext[0] }
$turnId = ($turnLine | Select-String -Pattern '"turnId":"([^"]+)"' | ForEach-Object { $_.Matches[0].Groups[1].Value })

if (-not $turnId) {
  Write-Host "Could not find turnId in Gemini response." -ForegroundColor Red
  exit 1
}

Write-Host "Gemini turnId: $turnId" -ForegroundColor Green

# Fetch injected context
curl.exe -i "$baseUrl/api/chat/turn/$turnId/injected"
