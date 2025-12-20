#!/bin/bash

# Workspace Deployment Validation Script
# Validates that workspace features are properly deployed and configured

set -e

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
TIMEOUT=30
VALIDATION_LOG="workspace-deployment-validation.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$VALIDATION_LOG"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$VALIDATION_LOG"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$VALIDATION_LOG"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$VALIDATION_LOG"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test result tracking
test_result() {
    local test_name="$1"
    local result="$2"
    local message="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$result" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        log "✅ $test_name: PASS - $message"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        error "❌ $test_name: FAIL - $message"
    fi
}

# HTTP request helper
make_request() {
    local url="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    
    local response
    local status_code
    
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" --connect-timeout "$TIMEOUT" || echo -e "\n000")
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "$response" | head -n -1
        return 0
    else
        error "HTTP request failed: $method $url returned $status_code (expected $expected_status)"
        return 1
    fi
}

# Test API endpoint availability
test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    info "Testing $description..."
    
    if response=$(make_request "$API_BASE_URL$endpoint" "GET" "$expected_status"); then
        test_result "$description" "PASS" "Endpoint accessible"
        echo "$response"
    else
        test_result "$description" "FAIL" "Endpoint not accessible"
        return 1
    fi
}

# Test JSON response structure
test_json_structure() {
    local json_response="$1"
    local required_fields="$2"
    local test_name="$3"
    
    if ! echo "$json_response" | jq . >/dev/null 2>&1; then
        test_result "$test_name" "FAIL" "Invalid JSON response"
        return 1
    fi
    
    local missing_fields=""
    for field in $required_fields; do
        if ! echo "$json_response" | jq -e ".$field" >/dev/null 2>&1; then
            missing_fields="$missing_fields $field"
        fi
    done
    
    if [ -n "$missing_fields" ]; then
        test_result "$test_name" "FAIL" "Missing required fields:$missing_fields"
        return 1
    else
        test_result "$test_name" "PASS" "All required fields present"
        return 0
    fi
}

# Main validation functions
validate_basic_health() {
    log "=== Basic Health Check Validation ==="
    
    # Test basic API health
    if response=$(test_api_endpoint "/api/health" "Basic API Health"); then
        test_json_structure "$response" "status timestamp uptime environment" "Basic Health Response Structure"
        
        # Check if status is 'ok'
        status=$(echo "$response" | jq -r '.status')
        if [ "$status" = "ok" ]; then
            test_result "Basic Health Status" "PASS" "API status is healthy"
        else
            test_result "Basic Health Status" "FAIL" "API status is $status"
        fi
    fi
    
    # Test detailed API health
    if response=$(test_api_endpoint "/api/health" "Detailed API Health"); then
        test_json_structure "$response" "status services memory" "Detailed Health Response Structure"
    fi
}

validate_workspace_configuration() {
    log "=== Workspace Configuration Validation ==="
    
    # Test workspace configuration endpoint
    if response=$(test_api_endpoint "/api/workspace-config" "Workspace Configuration"); then
        test_json_structure "$response" "success data" "Workspace Config Response Structure"
        
        # Validate configuration data structure
        config_data=$(echo "$response" | jq '.data')
        test_json_structure "$config_data" "enabled maxTeamSize maxTasksPerWorkspace" "Workspace Config Data Structure"
        
        # Check if workspace is enabled
        enabled=$(echo "$config_data" | jq -r '.enabled')
        if [ "$enabled" = "true" ]; then
            test_result "Workspace Feature Enabled" "PASS" "Workspace features are enabled"
        else
            test_result "Workspace Feature Enabled" "FAIL" "Workspace features are disabled"
        fi
        
        # Validate configuration values
        max_team_size=$(echo "$config_data" | jq -r '.maxTeamSize')
        max_tasks=$(echo "$config_data" | jq -r '.maxTasksPerWorkspace')
        
        if [ "$max_team_size" -gt 0 ] 2>/dev/null; then
            test_result "Max Team Size Configuration" "PASS" "Max team size: $max_team_size"
        else
            test_result "Max Team Size Configuration" "FAIL" "Invalid max team size: $max_team_size"
        fi
        
        if [ "$max_tasks" -gt 0 ] 2>/dev/null; then
            test_result "Max Tasks Configuration" "PASS" "Max tasks per workspace: $max_tasks"
        else
            test_result "Max Tasks Configuration" "FAIL" "Invalid max tasks: $max_tasks"
        fi
    fi
}

validate_workspace_health() {
    log "=== Workspace Health Check Validation ==="
    
    # Test workspace health endpoint
    if response=$(test_api_endpoint "/api/workspace-config/health" "Workspace Health Check"); then
        test_json_structure "$response" "success data" "Workspace Health Response Structure"
        
        # Validate health data structure
        health_data=$(echo "$response" | jq '.data')
        test_json_structure "$health_data" "enabled valid errors timestamp" "Workspace Health Data Structure"
        
        # Check configuration validity
        valid=$(echo "$health_data" | jq -r '.valid')
        if [ "$valid" = "true" ]; then
            test_result "Workspace Configuration Validity" "PASS" "Configuration is valid"
        else
            test_result "Workspace Configuration Validity" "FAIL" "Configuration has validation errors"
            
            # Log validation errors
            errors=$(echo "$health_data" | jq -r '.errors[]' 2>/dev/null || echo "No error details available")
            warning "Validation errors: $errors"
        fi
    fi
}

validate_workspace_features() {
    log "=== Workspace Feature Flags Validation ==="
    
    # Test workspace features endpoint
    if response=$(test_api_endpoint "/api/workspace-config/features" "Workspace Features"); then
        test_json_structure "$response" "success data" "Workspace Features Response Structure"
        
        # Validate features data structure
        features_data=$(echo "$response" | jq '.data')
        required_features="workspaceEnabled autoProvision templateSharing notifications analytics"
        test_json_structure "$features_data" "$required_features" "Workspace Features Data Structure"
        
        # Check individual features
        workspace_enabled=$(echo "$features_data" | jq -r '.workspaceEnabled')
        auto_provision=$(echo "$features_data" | jq -r '.autoProvision')
        template_sharing=$(echo "$features_data" | jq -r '.templateSharing')
        notifications=$(echo "$features_data" | jq -r '.notifications')
        analytics=$(echo "$features_data" | jq -r '.analytics')
        
        test_result "Workspace Enabled Feature" "$([ "$workspace_enabled" = "true" ] && echo "PASS" || echo "FAIL")" "Workspace enabled: $workspace_enabled"
        test_result "Auto Provision Feature" "$([ "$auto_provision" = "true" ] && echo "PASS" || echo "FAIL")" "Auto provision: $auto_provision"
        test_result "Template Sharing Feature" "$([ "$template_sharing" = "true" ] && echo "PASS" || echo "FAIL")" "Template sharing: $template_sharing"
        test_result "Notifications Feature" "$([ "$notifications" = "true" ] && echo "PASS" || echo "FAIL")" "Notifications: $notifications"
        test_result "Analytics Feature" "$([ "$analytics" = "true" ] && echo "PASS" || echo "FAIL")" "Analytics: $analytics"
    fi
}

validate_workspace_limits() {
    log "=== Workspace Limits Validation ==="
    
    # Test workspace limits endpoint
    if response=$(test_api_endpoint "/api/workspace-config/limits" "Workspace Limits"); then
        test_json_structure "$response" "success data" "Workspace Limits Response Structure"
        
        # Validate limits data structure
        limits_data=$(echo "$response" | jq '.data')
        required_limits="maxTeamSize maxTasksPerWorkspace sessionTimeoutMinutes dissolutionDelayDays"
        test_json_structure "$limits_data" "$required_limits" "Workspace Limits Data Structure"
        
        # Validate limit values
        max_team_size=$(echo "$limits_data" | jq -r '.maxTeamSize')
        max_tasks=$(echo "$limits_data" | jq -r '.maxTasksPerWorkspace')
        session_timeout=$(echo "$limits_data" | jq -r '.sessionTimeoutMinutes')
        dissolution_delay=$(echo "$limits_data" | jq -r '.dissolutionDelayDays')
        
        # Test reasonable limits
        if [ "$max_team_size" -ge 1 ] && [ "$max_team_size" -le 1000 ] 2>/dev/null; then
            test_result "Team Size Limit" "PASS" "Reasonable team size limit: $max_team_size"
        else
            test_result "Team Size Limit" "FAIL" "Unreasonable team size limit: $max_team_size"
        fi
        
        if [ "$max_tasks" -ge 10 ] && [ "$max_tasks" -le 10000 ] 2>/dev/null; then
            test_result "Tasks Limit" "PASS" "Reasonable tasks limit: $max_tasks"
        else
            test_result "Tasks Limit" "FAIL" "Unreasonable tasks limit: $max_tasks"
        fi
        
        if [ "$session_timeout" -ge 15 ] && [ "$session_timeout" -le 1440 ] 2>/dev/null; then
            test_result "Session Timeout" "PASS" "Reasonable session timeout: $session_timeout minutes"
        else
            test_result "Session Timeout" "FAIL" "Unreasonable session timeout: $session_timeout minutes"
        fi
        
        if [ "$dissolution_delay" -ge 0 ] && [ "$dissolution_delay" -le 365 ] 2>/dev/null; then
            test_result "Dissolution Delay" "PASS" "Reasonable dissolution delay: $dissolution_delay days"
        else
            test_result "Dissolution Delay" "FAIL" "Unreasonable dissolution delay: $dissolution_delay days"
        fi
    fi
}

validate_workspace_api_endpoints() {
    log "=== Workspace API Endpoints Validation ==="
    
    # Test core workspace API endpoints (these might return 401 without auth, which is expected)
    endpoints=(
        "/api/workspace:401:Workspace API"
        "/api/team:401:Team Management API"
        "/api/task:401:Task Management API"
        "/api/workspace-communication:401:Workspace Communication API"
        "/api/workspace-templates:401:Workspace Templates API"
        "/api/workspace-security:401:Workspace Security API"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint expected_status description <<< "$endpoint_info"
        
        info "Testing $description..."
        if make_request "$API_BASE_URL$endpoint" "GET" "$expected_status" >/dev/null 2>&1; then
            test_result "$description" "PASS" "Endpoint responds correctly"
        else
            test_result "$description" "FAIL" "Endpoint not responding as expected"
        fi
    done
}

validate_database_schema() {
    log "=== Database Schema Validation ==="
    
    # This would typically require database access
    # For now, we'll test if the API can connect to the database
    info "Testing database connectivity through API..."
    
    if response=$(test_api_endpoint "/api/health" "Database Connectivity Check"); then
        # Check if database service is reported as 'ok'
        db_status=$(echo "$response" | jq -r '.services.database // "unknown"' 2>/dev/null || echo "unknown")
        
        if [ "$db_status" = "ok" ]; then
            test_result "Database Connectivity" "PASS" "Database connection successful"
        else
            test_result "Database Connectivity" "FAIL" "Database connection failed: $db_status"
        fi
    fi
}

validate_security_configuration() {
    log "=== Security Configuration Validation ==="
    
    # Test that sensitive endpoints require authentication
    sensitive_endpoints=(
        "/api/workspace-config/admin"
        "/api/workspace"
        "/api/team"
        "/api/task"
    )
    
    for endpoint in "${sensitive_endpoints[@]}"; do
        info "Testing security for $endpoint..."
        
        # Should return 401 Unauthorized without proper authentication
        if make_request "$API_BASE_URL$endpoint" "GET" "401" >/dev/null 2>&1; then
            test_result "Security: $endpoint" "PASS" "Properly protected endpoint"
        else
            test_result "Security: $endpoint" "FAIL" "Endpoint not properly protected"
        fi
    done
}

validate_performance() {
    log "=== Performance Validation ==="
    
    # Test response times for key endpoints
    endpoints=(
        "/api/health"
        "/api/workspace-config"
        "/api/workspace-config/health"
        "/api/workspace-config/features"
    )
    
    for endpoint in "${endpoints[@]}"; do
        info "Testing performance for $endpoint..."
        
        start_time=$(date +%s%N)
        if make_request "$API_BASE_URL$endpoint" "GET" "200" >/dev/null 2>&1; then
            end_time=$(date +%s%N)
            response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
            
            if [ "$response_time" -lt 5000 ]; then # Less than 5 seconds
                test_result "Performance: $endpoint" "PASS" "Response time: ${response_time}ms"
            else
                test_result "Performance: $endpoint" "FAIL" "Slow response time: ${response_time}ms"
            fi
        else
            test_result "Performance: $endpoint" "FAIL" "Endpoint not accessible"
        fi
    done
}

generate_validation_report() {
    log "=== Validation Report ==="
    
    local pass_rate=0
    if [ "$TESTS_TOTAL" -gt 0 ]; then
        pass_rate=$(( (TESTS_PASSED * 100) / TESTS_TOTAL ))
    fi
    
    echo ""
    log "Validation Summary:"
    log "=================="
    log "Total Tests: $TESTS_TOTAL"
    log "Passed: $TESTS_PASSED"
    log "Failed: $TESTS_FAILED"
    log "Pass Rate: ${pass_rate}%"
    echo ""
    
    if [ "$TESTS_FAILED" -eq 0 ]; then
        log "🎉 All validation tests passed! Workspace deployment is ready."
        return 0
    else
        error "⚠️  $TESTS_FAILED validation tests failed. Please review and fix issues before deployment."
        return 1
    fi
}

# Main execution
main() {
    log "Starting Workspace Deployment Validation"
    log "API Base URL: $API_BASE_URL"
    log "Timeout: ${TIMEOUT}s"
    echo ""
    
    # Check prerequisites
    if ! command -v curl >/dev/null 2>&1; then
        error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq >/dev/null 2>&1; then
        error "jq is required but not installed"
        exit 1
    fi
    
    # Run validation tests
    validate_basic_health
    validate_workspace_configuration
    validate_workspace_health
    validate_workspace_features
    validate_workspace_limits
    validate_workspace_api_endpoints
    validate_database_schema
    validate_security_configuration
    validate_performance
    
    # Generate final report
    generate_validation_report
}

# Handle script arguments
case "${1:-validate}" in
    "validate")
        main
        ;;
    "health-only")
        validate_basic_health
        validate_workspace_health
        generate_validation_report
        ;;
    "config-only")
        validate_workspace_configuration
        validate_workspace_features
        validate_workspace_limits
        generate_validation_report
        ;;
    "security-only")
        validate_security_configuration
        generate_validation_report
        ;;
    "performance-only")
        validate_performance
        generate_validation_report
        ;;
    *)
        echo "Usage: $0 [validate|health-only|config-only|security-only|performance-only]"
        echo ""
        echo "Commands:"
        echo "  validate        Run all validation tests (default)"
        echo "  health-only     Run only health check validations"
        echo "  config-only     Run only configuration validations"
        echo "  security-only   Run only security validations"
        echo "  performance-only Run only performance validations"
        exit 1
        ;;
esac