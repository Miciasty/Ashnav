param(
    [string]$Maven = 'mvn',
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$Settings,
    [string]$LibrariesDirectory,
    [switch]$Offline,
    [switch]$SkipConsumer
)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$taskWorkspace = Split-Path $taskRoot -Parent
if ($LibrariesDirectory) { $taskWorkspace = (Resolve-Path -LiteralPath $LibrariesDirectory).Path }
$taskVerification = Join-Path $taskRoot '.verification'
$taskRun = Join-Path $taskVerification ('cross-library-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$taskRepository = Join-Path $taskVerification 'repository'
$taskSettings = Join-Path $taskRun 'settings.xml'
New-Item -ItemType Directory -Path $taskRun -ErrorAction Stop | Out-Null
Set-Content -LiteralPath $taskSettings -Value '<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"/>' -Encoding utf8
if ($Settings) { Copy-Item -LiteralPath $Settings -Destination $taskSettings }
Set-Content -LiteralPath (Join-Path $taskVerification 'cross-library-run.txt') -Value $taskRun -Encoding utf8
if ($JavaHome) { $env:JAVA_HOME = $JavaHome }

function Invoke-Verification([string]$Project, [string]$Label, [string[]]$Goals) {
    $taskArguments = @('-B', '-ntp', '-s', $taskSettings, "-Dmaven.repo.local=$taskRepository", '-f', (Join-Path $Project 'pom.xml'))
    if ($Offline) { $taskArguments += '-o' }
    $taskLog = Join-Path $taskRun ($Label + '.log')
    & $Maven @taskArguments @Goals *> $taskLog
    if ($LASTEXITCODE -ne 0) {
        Get-Content -LiteralPath $taskLog -Tail 50
        throw "$Label failed; see $taskLog"
    }
    Get-Content -LiteralPath $taskLog | Select-String 'Tests run:.*Skipped: \d+$|BUILD SUCCESS|Finished at:' | ForEach-Object { $_.Line }
}

$taskVersions = @{}
foreach ($taskLibrary in 'Ashcore', 'Ashgrid', 'Ashspace', 'Ashtrace', 'Ashnav') {
    $taskSource = Join-Path $taskWorkspace $taskLibrary
    if ($taskLibrary -eq 'Ashnav') { $taskSource = $taskRoot }
    $taskCopy = Join-Path $taskRun $taskLibrary
    New-Item -ItemType Directory -Path $taskCopy | Out-Null
    Copy-Item -LiteralPath (Join-Path $taskSource 'src') -Destination $taskCopy -Recurse
    foreach ($taskFile in 'pom.xml', 'README.md', 'LICENSE', 'NOTICE') {
        Copy-Item -LiteralPath (Join-Path $taskSource $taskFile) -Destination $taskCopy
    }
    [xml]$taskPom = Get-Content -LiteralPath (Join-Path $taskCopy 'pom.xml') -Raw
    $taskVersions[$taskPom.project.artifactId] = [string]$taskPom.project.version
    if (-not $taskPom.project.version.EndsWith('-SNAPSHOT')) {
        throw "$taskLibrary must use development coordinates for this local source integration"
    }
    Add-Content -LiteralPath (Join-Path $taskRun 'source-commits.txt') -Value $taskLibrary
    & git -c "safe.directory=$($taskSource.Replace('\', '/'))" -C $taskSource rev-parse HEAD >> (Join-Path $taskRun 'source-commits.txt')
    if ($LASTEXITCODE -ne 0) { throw "Cannot identify $taskLibrary" }
    Add-Content -LiteralPath (Join-Path $taskRun 'source-status.txt') -Value $taskLibrary
    & git -c "safe.directory=$($taskSource.Replace('\', '/'))" -C $taskSource status --porcelain >> (Join-Path $taskRun 'source-status.txt')
    if ($LASTEXITCODE -ne 0) { throw "Cannot inspect $taskLibrary" }
    # Change only copied POMs, so the integration uses the freshly built lower layers.
    $taskChanged = $false
    foreach ($taskDependency in $taskPom.project.dependencies.dependency) {
        if ($taskDependency.groupId -eq 'dev.nasaka.blackframe') {
            $taskVersion = $taskVersions[[string]$taskDependency.artifactId]
            if (-not $taskVersion) { throw "Unbuilt dependency: $($taskDependency.artifactId)" }
            if ($taskDependency.version -match '^\$\{(.+)\}$') {
                if ($taskPom.project.properties.($Matches[1]) -ne $taskVersion) {
                    $taskPom.project.properties.($Matches[1]) = $taskVersion
                    $taskChanged = $true
                }
            } elseif ($taskDependency.version -ne $taskVersion) {
                $taskDependency.version = $taskVersion
                $taskChanged = $true
            }
        }
    }
    if ($taskLibrary -eq 'Ashnav' -and $taskChanged) {
        throw 'Ashnav declared dependencies differ from this source integration; review them instead of silently overriding them'
    }
    if ($taskChanged) { $taskPom.Save((Join-Path $taskCopy 'pom.xml')) }
    Invoke-Verification $taskCopy $taskLibrary @('clean', 'verify', 'org.apache.maven.plugins:maven-install-plugin:3.1.3:install')
    Get-FileHash -LiteralPath (Join-Path $taskCopy "target/$($taskPom.project.artifactId)-$($taskPom.project.version).jar") -Algorithm SHA256 |
        Select-Object Path, Hash | ConvertTo-Json -Compress >> (Join-Path $taskRun 'artifact-hashes.jsonl')
}

if (-not $SkipConsumer) {
    Invoke-Verification (Join-Path $taskRoot 'integration/blackframe') 'consumer' @(
        'clean', 'verify', "-Dintegration.buildDirectory=$taskRun/consumer",
        'org.apache.maven.plugins:maven-dependency-plugin:3.8.1:tree'
    )
}
Write-Output "Verification evidence: $taskRun"
