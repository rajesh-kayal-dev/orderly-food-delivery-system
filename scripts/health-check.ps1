Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "       Orderly Microservices Health Check Utility       " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$services = @(
    @{ Name = "API Gateway";            Url = "http://localhost:8000/health" },
    @{ Name = "Identity Service";       Url = "http://localhost:5003/health" },
    @{ Name = "Restaurant Service";     Url = "http://localhost:5004/health" },
    @{ Name = "Order Service";          Url = "http://localhost:5002/health" },
    @{ Name = "Notification Service";   Url = "http://localhost:5005/health" }
)

foreach ($s in $services) {
    try {
        $res = Invoke-RestMethod -Uri $s.Url -Method Get -TimeoutSec 3
        Write-Host "[PASS] $($s.Name): $($res.status) (uptime: $([math]::Round($res.uptime, 1))s)" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] $($s.Name) is OFFLINE ($($_.Exception.Message))" -ForegroundColor Red
    }
}
