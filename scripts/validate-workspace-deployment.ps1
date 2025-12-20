# Workspace Deployment Validation Script (PowerShell)
# Validates that workspace features are properly deployed and configured

param(
    [Parameter(Position=0)]
    [ValidateSet("validate", "health-only", "config-only", "security-only", "performance-only")]
    [string]$Command = "validate",
    
    [string]$ApiBaseUrl = "http://localhost:3000",
    [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Continue"

# Configuration
$ValidationLog = "workspace-deployment-validation.log"

# Test counters
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsTotal = 0

# Logging functions
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "ERROR" { Write-Host $logMessage -ForegroundColor Red }
        "WARNING" { Write-Host $logMessage -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logMessage -ForegroundColor Green }
        "INFO" { Write-Host $logMessage -ForegroundColor Blue }
        default { Write-Host $logMessage -ForegroundColor White }
    }
    
    Add-Content -Path $ValidationLog -Value $logMessage
}

function Write-Error-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "ERROR"
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "WARNING"
}

function Write-Success-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "SUCCESS"
}

function Write-Info-Log {
    param([string]$Message)
    Write-Log -Message $Message -Level "INFO"
}

# Test result tracking
function Test-Result {
    param(
        [string]$TestName,
        [string]$Result,
        [string]$Message
    )
    
    $script:TestsTotal++
    
    if ($Result -eq "PASS") {
        $script:TestsPassed++
        Write-Success-Log "✅ $TestName`: PASS - $Message"
    } else {
        $script:TestsFailed++
        Write-Error-Log "❌ $TestName`: FAIL - $Message"
    }
}

# HTTP request helper
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [int]$ExpectedStatusCode = 200
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -TimeoutSec $TimeoutSeconds -ErrorAction Stop
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        if ($statusCode -eq $ExpectedStatusCode) {
            return @{
                Success = $true
                Data = $null
                StatusCode = $statusCode
            }
        }
        
        Write-Error-Log "HTTP request failed: $Method $Url returned $statusCode (expected $ExpectedStatusCode)"
        return @{
            Success = $false
            Data = $null
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# Test API endpoint availability
function Test-ApiEndpoint {
    param(
        [string]$Endpoint,
        [string]$Description,
        [int]$ExpectedStatusCode = 200
    )
    
    Write-Info-Log "Testing $Description..."
    
    $result = Invoke-ApiRequest -Url "$ApiBaseUrl$Endpoint" -Method "GET" -ExpectedStatusCode $ExpectedStatusCode
    
    if ($result.Success) {
        Test-Result -TestName $Description -Result "PASS" -Message "Endpoint accessible"
        return $result.Data
    } else {
        Test-Result -TestName $Description -Result "FAIL" -Message "Endpoint not accessible"
        return $null
    }
}

# Test JSON response structure
function Test-JsonStructure {
    param(
        [object]$JsonResponse,
        [string[]]$RequiredFields,
        [string]$TestName
    )
    
    if (-not $JsonResponse) {
        Test-Result -TestName $TestName -Result "FAIL" -Message "No JSON response to validate"
        return $false
    }
    
    $missingFields = @()
    foreach ($field in $RequiredFields) {
        if (-not ($JsonResponse.PSObject.Properties.Name -contains $field)) {
            $missingFields += $field
        }
    }
    
    if ($missingFields.Count -gt 0) {
        Test-Result -TestName $TestName -Result "FAIL" -Message "Missing required fields: $($missingFields -join ', ')"
        return $false
    } else {
        Test-Result -TestName $TestName -Result "PASS" -Message "All required fields present"
        return $true
    }
}

# Validation functions
function Test-BasicHealth {
    Write-Log "=== Basic Health Check Validation ===" -Level "SUCCESS"
    
    # Test basic API health
    $response = Test-ApiEndpoint -Endpoint "/api/health" -Description "Basic API Health"
    
    if ($response) {
        Test-JsonStructure -JsonResponse $response -RequiredFields @("status", "timestamp", "uptime", "environment") -TestName "Basic Health Response Structure"
        
        # Check if status is 'ok'
        if ($response.status -eq "ok") {
            Test-Result -TestName "Basic Health Status" -Result "PASS" -Message "API status is healthy"
        } else {
            Test-Result -TestName "Basic Health Status" -Result "FAIL" -Message "API status is $($response.status)"
        }
    }
}

function Test-WorkspaceConfiguration {
    Write-Log "=== Workspace Configuration Validation ===" -Level "SUCCESS"
    
    # Test workspace configuration endpoint
    $response = Test-ApiEndpoint -Endpoint "/api/workspace-config" -Description "Workspace Configuration"
    
    if ($response) {
        Test-JsonStructure -JsonResponse $response -RequiredFields @("success", "data") -TestName "Workspace Config Response Structure"
        
        if ($response.data) {
            # Validate configuration data structure
            Test-JsonStructure -JsonResponse $response.data -RequiredFields @("enabled", "maxTeamSize", "maxTasksPerWorkspace") -TestName "Workspace Config Data Structure"
            
            # Check if workspace is enabled
            if ($response.data.enabled -eq $true) {
                Test-Result -TestName "Workspace Feature Enabled" -Result "PASS" -Message "Workspace features are enabled"
            } else {
                Test-Result -TestName "Workspace Feature Enabled" -Result "FAIL" -Message "Workspace features are disabled"
            }
            
            # Validate configuration values
            if ($response.data.maxTeamSize -gt 0) {
                Test-Result -TestName "Max Team Size Configuration" -Result "PASS" -Message "Max team size: $($response.data.maxTeamSize)"
            } else {
                Test-Result -TestName "Max Team Size Configuration" -Result "FAIL" -Message "Invalid max team size: $($response.data.maxTeamSize)"
            }
            
            if ($response.data.maxTasksPerWorkspace -gt 0) {
                Test-Result -TestName "Max Tasks Configuration" -Result "PASS" -Message "Max tasks per workspace: $($response.data.maxTasksPerWorkspace)"
            } else {
                Test-Result -TestName "Max Tasks Configuration" -Result "FAIL" -Message "Invalid max tasks: $($response.data.maxTasksPerWorkspace)"
            }
        }
    }
}

function Test-WorkspaceHealth {
    Write-Log "=== Workspace Health Check Validation ===" -Level "SUCCESS"
    
    # Test workspace health endpoint
    $response = Test-ApiEndpoint -Endpoint "/api/workspace-config/health" -Description "Workspace Health Check"
    
    if ($response) {
        Test-JsonStructure -JsonResponse $response -RequiredFields @("success", "data") -TestName "Workspace Health Response Structure"
        
        if ($response.data) {
            # Validate health data structure
            Test-JsonStructure -JsonResponse $response.data -RequiredFields @("enabled", "valid", "errors", "timestamp") -TestName "Workspace Health Data Structure"
            
            # Check configuration validity
            if ($response.data.valid -eq $true) {
                Test-Result -TestName "Workspace Configuration Validity" -Result "PASS" -Message "Configuration is valid"
            } else {
                Test-Result -TestName "Workspace Configuration Validity" -Result "FAIL" -Message "Configuration has validation errors"
                
                # Log validation errors
                if ($response.data.errors -and $response.data.errors.Count -gt 0) {
                    Write-Warning-Log "Validation errors: $($response.data.errors -join ', ')"
                }
            }
        }
    }
}

function Test-WorkspaceFeatures {
    Write-Log "=== Workspace Feature Flags Validation ===" -Level "SUCCESS"
    
    # Test workspace features endpoint
    $response = Test-ApiEndpoint -Endpoint "/api/workspace-config/features" -Description "Workspace Features"
    
    if ($response) {
        Test-JsonStructure -JsonResponse $response -RequiredFields @("success", "data") -TestName "Workspace Features Response Structure"
        
        if ($response.data) {
            # Validate features data structure
            $requiredFeatures = @("workspaceEnabled", "autoProvision", "templateSharing", "notifications", "analytics")
            Test-JsonStructure -JsonResponse $response.data -RequiredFields $requiredFeatures -TestName "Workspace Features Data Structure"
            
            # Check individual features
            $features = @{
                "Workspace Enabled Feature" = $response.data.workspaceEnabled
                "Auto Provision Feature" = $response.data.autoProvision
                "Template Sharing Feature" = $response.data.templateSharing
                "Notifications Feature" = $response.data.notifications
                "Analytics Feature" = $response.data.analytics
            }
            
            foreach ($feature in $features.GetEnumerator()) {
                $result = if ($feature.Value -eq $true) { "PASS" } else { "FAIL" }
                Test-Result -TestName $feature.Key -Result $result -Message "$($feature.Key): $($feature.Value)"
            }
        }
    }
}

function Test-WorkspaceLimits {
    Write-Log "=== Workspace Limits Validation ===" -Level "SUCCESS"
    
    # Test workspace limits endpoint
    $response = Test-ApiEndpoint -Endpoint "/api/workspace-config/limits" -Description "Workspace Limits"
    
    if ($response) {
        Test-JsonStructure -JsonResponse $response -RequiredFields @("success", "data") -TestName "Workspace Limits Response Structure"
        
        if ($response.data) {
            # Validate limits data structure
            $requiredLimits = @("maxTeamSize", "maxTasksPerWorkspace", "sessionTimeoutMinutes", "dissolutionDelayDays")
            Test-JsonStructure -JsonResponse $response.data -RequiredFields $requiredLimits -TestName "Workspace Limits Data Structure"
            
            # Validate limit values
            $limits = $response.data
            
            # Test reasonable limits
            if ($limits.maxTeamSize -ge 1 -and $limits.maxTeamSize -le 1000) {
                Test-Result -TestName "Team Size Limit" -Result "PASS" -Message "Reasonable team size limit: $($limits.maxTeamSize)"
            } else {
                Test-Result -TestName "Team Size Limit" -Result "FAIL" -Message "Unreasonable team size limit: $($limits.maxTeamSize)"
            }
            
            if ($limits.maxTasksPerWorkspace -ge 10 -and $limits.maxTasksPerWorkspace -le 10000) {
                Test-Result -TestName "Tasks Limit" -Result "PASS" -Message "Reasonable tasks limit: $($limits.maxTasksPerWorkspace)"
            } else {
                Test-Result -TestName "Tasks Limit" -Result "FAIL" -Message "Unreasonable tasks limit: $($limits.maxTasksPerWorkspace)"
            }
            
            if ($limits.sessionTimeoutMinutes -ge 15 -and $limits.sessionTimeoutMinutes -le 1440) {
                Test-Result -TestName "Session Timeout" -Result "PASS" -Message "Reasonable session timeout: $($limits.sessionTimeoutMinutes) minutes"
            } else {
                Test-Result -TestName "Session Timeout" -Result "FAIL" -Message "Unreasonable session timeout: $($limits.sessionTimeoutMinutes) minutes"
            }
            
            if ($limits.dissolutionDelayDays -ge 0 -and $limits.dissolutionDelayDays -le 365) {
                Test-Result -TestName "Dissolution Delay" -Result "PASS" -Message "Reasonable dissolution delay: $($limits.dissolutionDelayDays) days"
            } else {
                Test-Result -TestName "Dissolution Delay" -Result "FAIL" -Message "Unreasonable dissolution delay: $($limits.dissolutionDelayDays) days"
            }
        }
    }
}

function Test-WorkspaceApiEndpoints {
    Write-Log "=== Workspace API Endpoints Validation ===" -Level "SUCCESS"
    
    # Test core workspace API endpoints (these might return 401 without auth, which is expected)
    $endpoints = @(
        @{ Endpoint = "/api/workspace"; ExpectedStatus = 401; Description = "Workspace API" }
        @{ Endpoint = "/api/team"; ExpectedStatus = 401; Description = "Team Management API" }
        @{ Endpoint = "/api/task"; ExpectedStatus = 401; Description = "Task Management API" }
        @{ Endpoint = "/api/workspace-communication"; ExpectedStatus = 401; Description = "Workspace Communication API" }
        @{ Endpoint = "/api/workspace-templates"; ExpectedStatus = 401; Description = "Workspace Templates API" }
        @{ Endpoint = "/api/workspace-security"; ExpectedStatus = 401; Description = "Workspace Security API" }
    )
    
    foreach ($endpointInfo in $endpoints) {
        Write-Info-Log "Testing $($endpointInfo.Description)..."
        
        $result = Invoke-ApiRequest -Url "$ApiBaseUrl$($endpointInfo.Endpoint)" -Method "GET" -ExpectedStatusCode $endpointInfo.ExpectedStatus
        
        if ($result.Success) {
            Test-Result -TestName $endpointInfo.Description -Result "PASS" -Message "Endpoint responds correctly"
        } else {
            Test-Result -TestName $endpointInfo.Description -Result "FAIL" -Message "Endpoint not responding as expected"
        }
    }
}

function Test-DatabaseSchema {
    Write-Log "=== Database Schema Validation ===" -Level "SUCCESS"
    
    # Test if the API can connect to the database
    Write-Info-Log "Testing database connectivity through API..."
    
    $response = Test-ApiEndpoint -Endpoint "/api/health" -Description "Database Connectivity Check"
    
    if ($response -and $response.services) {
        $dbStatus = $response.services.database
        
        if ($dbStatus -eq "ok") {
            Test-Result -TestName "Database Connectivity" -Result "PASS" -Message "Database connection successful"
        } else {
            Test-Result -TestName "Database Connectivity" -Result "FAIL" -Message "Database connection failed: $dbStatus"
        }
    } else {
        Test-Result -TestName "Database Connectivity" -Result "FAIL" -Message "Unable to determine database status"
    }
}

function Test-SecurityConfiguration {
    Write-Log "=== Security Configuration Validation ===" -Level "SUCCESS"
    
    # Test that sensitive endpoints require authentication
    $sensitiveEndpoints = @(
        "/api/workspace-config/admin",
        "/api/workspace",
        "/api/team",
        "/api/task"
    )
    
    foreach ($endpoint in $sensitiveEndpoints) {
        Write-Info-Log "Testing security for $endpoint..."
        
        # Should return 401 Unauthorized without proper authentication
        $result = Invoke-ApiRequest -Url "$ApiBaseUrl$endpoint" -Method "GET" -ExpectedStatusCode 401
        
        if ($result.Success) {
            Test-Result -TestName "Security: $endpoint" -Result "PASS" -Message "Properly protected endpoint"
        } else {
            Test-Result -TestName "Security: $endpoint" -Result "FAIL" -Message "Endpoint not properly protected"
        }
    }
}

function Test-Performance {
    Write-Log "=== Performance Validation ===" -Level "SUCCESS"
    
    # Test response times for key endpoints
    $endpoints = @(
        "/api/health",
        "/api/workspace-config",
        "/api/workspace-config/health",
        "/api/workspace-config/features"
    )
    
    foreach ($endpoint in $endpoints) {
        Write-Info-Log "Testing performance for $endpoint..."
        
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $result = Invoke-ApiRequest -Url "$ApiBaseUrl$endpoint" -Method "GET" -ExpectedStatusCode 200
        $stopwatch.Stop()
        
        if ($result.Success) {
            $responseTime = $stopwatch.ElapsedMilliseconds
            
            if ($responseTime -lt 5000) { # Less than 5 seconds
                Test-Result -TestName "Performance: $endpoint" -Result "PASS" -Message "Response time: ${responseTime}ms"
            } else {
                Test-Result -TestName "Performance: $endpoint" -Result "FAIL" -Message "Slow response time: ${responseTime}ms"
            }
        } else {
            Test-Result -TestName "Performance: $endpoint" -Result "FAIL" -Message "Endpoint not accessible"
        }
    }
}

function New-ValidationReport {
    Write-Log "=== Validation Report ===" -Level "SUCCESS"
    
    $passRate = 0
    if ($script:TestsTotal -gt 0) {
        $passRate = [math]::Round(($script:TestsPassed * 100) / $script:TestsTotal, 2)
    }
    
    Write-Host ""
    Write-Log "Validation Summary:" -Level "SUCCESS"
    Write-Log "==================" -Level "SUCCESS"
    Write-Log "Total Tests: $($script:TestsTotal)" -Level "SUCCESS"
    Write-Log "Passed: $($script:TestsPassed)" -Level "SUCCESS"
    Write-Log "Failed: $($script:TestsFailed)" -Level "SUCCESS"
    Write-Log "Pass Rate: ${passRate}%" -Level "SUCCESS"
    Write-Host ""
    
    if ($script:TestsFailed -eq 0) {
        Write-Log "🎉 All validation tests passed! Workspace deployment is ready." -Level "SUCCESS"
        return $true
    } else {
        Write-Error-Log "⚠️ $($script:TestsFailed) validation tests failed. Please review and fix issues before deployment."
        return $false
    }
}

# Main execution function
function Start-Validation {
    Write-Log "Starting Workspace Deployment Validation" -Level "SUCCESS"
    Write-Log "API Base URL: $ApiBaseUrl" -Level "INFO"
    Write-Log "Timeout: ${TimeoutSeconds}s" -Level "INFO"
    Write-Host ""
    
    # Check prerequisites
    try {
        Invoke-RestMethod -Uri "http://httpbin.org/get" -TimeoutSec 5 -ErrorAction Stop | Out-Null
    }
    catch {
        Write-Error-Log "Unable to make HTTP requests. Please check network connectivity."
        return $false
    }
    
    # Run validation tests based on command
    switch ($Command) {
        "validate" {
            Test-BasicHealth
            Test-WorkspaceConfiguration
            Test-WorkspaceHealth
            Test-WorkspaceFeatures
            Test-WorkspaceLimits
            Test-WorkspaceApiEndpoints
            Test-DatabaseSchema
            Test-SecurityConfiguration
            Test-Performance
        }
        "health-only" {
            Test-BasicHealth
            Test-WorkspaceHealth
        }
        "config-only" {
            Test-WorkspaceConfiguration
            Test-WorkspaceFeatures
            Test-WorkspaceLimits
        }
        "security-only" {
            Test-SecurityConfiguration
        }
        "performance-only" {
            Test-Performance
        }
    }
    
    # Generate final report
    return New-ValidationReport
}

# Execute validation
try {
    $success = Start-Validation
    
    if ($success) {
        exit 0
    } else {
        exit 1
    }
}
catch {
    Write-Error-Log "Validation script failed: $($_.Exception.Message)"
    exit 1
}