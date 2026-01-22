#!/bin/bash

# Test script for Video Watch Analytics API
# Usage: ./test-api.sh [API_ENDPOINT]

API_ENDPOINT="${1:-http://localhost:8787}"
VIDEO_ID="test-video-$(date +%s)"

echo "========================================="
echo "Video Watch Analytics API Test"
echo "========================================="
echo "API Endpoint: $API_ENDPOINT"
echo "Video ID: $VIDEO_ID"
echo ""

# Test 1: Health check
echo "Test 1: Health Check"
echo "---------------------"
curl -s "$API_ENDPOINT/" | jq .
echo -e "\n"

# Test 2: Track single viewing session
echo "Test 2: Track Single Viewing Session"
echo "-------------------------------------"
curl -s -X POST "$API_ENDPOINT/api/track" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoId\": \"$VIDEO_ID\",
    \"ranges\": [
      {\"startTime\": 0, \"endTime\": 15.5}
    ]
  }" | jq .
echo -e "\n"

# Test 3: Track multiple ranges (seeking behavior)
echo "Test 3: Track Multiple Ranges (Seeking)"
echo "----------------------------------------"
curl -s -X POST "$API_ENDPOINT/api/track" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoId\": \"$VIDEO_ID\",
    \"ranges\": [
      {\"startTime\": 0, \"endTime\": 8.2},
      {\"startTime\": 45.7, \"endTime\": 60.3},
      {\"startTime\": 120.5, \"endTime\": 135.8}
    ]
  }" | jq .
echo -e "\n"

# Test 4: Track overlapping ranges
echo "Test 4: Track Overlapping Ranges"
echo "---------------------------------"
curl -s -X POST "$API_ENDPOINT/api/track" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoId\": \"$VIDEO_ID\",
    \"ranges\": [
      {\"startTime\": 5, \"endTime\": 12},
      {\"startTime\": 8, \"endTime\": 15}
    ]
  }" | jq .
echo -e "\n"

# Test 5: Get histogram
echo "Test 5: Get Histogram"
echo "---------------------"
curl -s "$API_ENDPOINT/api/histogram/$VIDEO_ID" | jq .
echo -e "\n"

# Test 6: Invalid request (missing ranges)
echo "Test 6: Invalid Request (Missing Ranges)"
echo "-----------------------------------------"
curl -s -X POST "$API_ENDPOINT/api/track" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoId\": \"$VIDEO_ID\"
  }" | jq .
echo -e "\n"

# Test 7: Invalid request (invalid range)
echo "Test 7: Invalid Request (Invalid Range)"
echo "----------------------------------------"
curl -s -X POST "$API_ENDPOINT/api/track" \
  -H "Content-Type: application/json" \
  -d "{
    \"videoId\": \"$VIDEO_ID\",
    \"ranges\": [
      {\"startTime\": 10, \"endTime\": 5}
    ]
  }" | jq .
echo -e "\n"

# Test 8: Get histogram for non-existent video
echo "Test 8: Histogram for Non-existent Video"
echo "-----------------------------------------"
curl -s "$API_ENDPOINT/api/histogram/non-existent-video" | jq .
echo -e "\n"

echo "========================================="
echo "All tests completed!"
echo "========================================="
